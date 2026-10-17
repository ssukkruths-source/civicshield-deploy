/**
 * Duplicate Incident Detection Service
 * Evaluates whether an incoming hazard report matches an unresolved hazard in the same area
 * within a 24-hour window, or within a close geographic radius (~500 meters).
 */

// Haversine formula to compute distance in kilometers between two coordinates
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function detectDuplicateIncident(existingIncidents, newReport) {
  // If user explicitly bypassed duplicate check via forceSubmit flag, skip
  if (newReport.forceSubmit === true || newReport.forceSubmit === 'true') {
    return { isDuplicate: false };
  }

  const now = Date.now();
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

  // Normalize input strings
  const targetCategory = (newReport.category || '').trim().toLowerCase();
  const targetArea = (newReport.area || '').trim().toLowerCase();
  const targetTitle = (newReport.title || '').trim().toLowerCase();

  for (const inc of existingIncidents) {
    // Only check unresolved incidents (Submitted, Acknowledged, Dispatched, On Site)
    if (inc.status === 'Resolved' || inc.status === 'Rejected') {
      continue;
    }

    const incTime = new Date(inc.created_at).getTime();
    const isWithin24Hours = now - incTime <= TWENTY_FOUR_HOURS_MS;
    if (!isWithin24Hours) continue;

    const incCategory = (inc.category || '').trim().toLowerCase();
    const incArea = (inc.area || '').trim().toLowerCase();
    const incTitle = (inc.title || '').trim().toLowerCase();

    // Check 1: Same category and exact or fuzzy matching area/sector
    const isCategoryMatch = incCategory === targetCategory;
    const isAreaMatch =
      incArea === targetArea ||
      (incArea && targetArea && (incArea.includes(targetArea) || targetArea.includes(incArea)));

    // Check 2: Distance proximity when lat/lng are provided
    let isGeographicMatch = false;
    let distanceKm = null;
    if (newReport.latitude && newReport.longitude && inc.latitude && inc.longitude) {
      distanceKm = calculateDistanceKm(
        Number(newReport.latitude),
        Number(newReport.longitude),
        Number(inc.latitude),
        Number(inc.longitude)
      );
      // Within ~0.5 km (500 meters)
      if (distanceKm !== null && distanceKm <= 0.5) {
        isGeographicMatch = true;
      }
    }

    // Check 3: Significant title similarity in the same area
    const isTitleMatch = incTitle === targetTitle || (incTitle.length > 5 && targetTitle.includes(incTitle));

    if (isCategoryMatch && (isAreaMatch || isGeographicMatch)) {
      return {
        isDuplicate: true,
        reason: isGeographicMatch
          ? `An active ${inc.category} report was already registered within ${Math.round((distanceKm || 0.3) * 1000)} meters in the past 24 hours.`
          : `An active ${inc.category} report already exists in "${inc.area}" reported ${Math.round((now - incTime) / (1000 * 60))} minutes ago.`,
        existingIncident: {
          id: inc.id,
          reference_id: inc.reference_id,
          title: inc.title,
          category: inc.category,
          status: inc.status,
          urgency: inc.urgency,
          landmark: inc.landmark,
          area: inc.area,
          created_at: inc.created_at,
          photo_url: inc.photo_url
        }
      };
    }
  }

  return { isDuplicate: false };
}
