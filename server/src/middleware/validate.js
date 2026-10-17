import { VALID_CATEGORIES, VALID_URGENCIES } from '../services/incidentService.js';

export function validateIncidentCreation(req, res, next) {
  const { title, description, category, landmark, area, urgency, latitude, longitude, photo_url } = req.body;
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length < 5) {
    errors.push('Title is required and must be at least 5 characters long.');
  }

  if (!description || typeof description !== 'string' || description.trim().length < 10) {
    errors.push('Description is required and must be at least 10 characters long.');
  }

  if (!category || !VALID_CATEGORIES.includes(category)) {
    errors.push(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }

  if (!landmark || typeof landmark !== 'string' || landmark.trim().length < 3) {
    errors.push('Landmark is required (e.g. "Corner of 5th Ave and Main St").');
  }

  if (!area || typeof area !== 'string' || area.trim().length < 2) {
    errors.push('Area or sector is required (e.g. "Downtown Ward 4").');
  }

  if (urgency && !VALID_URGENCIES.includes(urgency)) {
    errors.push(`Urgency must be one of: ${VALID_URGENCIES.join(', ')}`);
  }

  if (latitude != null && (isNaN(Number(latitude)) || Number(latitude) < -90 || Number(latitude) > 90)) {
    errors.push('Latitude must be a valid number between -90 and 90.');
  }

  if (longitude != null && (isNaN(Number(longitude)) || Number(longitude) < -180 || Number(longitude) > 180)) {
    errors.push('Longitude must be a valid number between -180 and 180.');
  }

  if (photo_url && typeof photo_url === 'string') {
    // Validate image format or URL scheme
    if (!photo_url.startsWith('http://') && !photo_url.startsWith('https://') && !photo_url.startsWith('data:image/')) {
      errors.push('Photo URL must be a valid web URL or base64 data image.');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }

  next();
}
