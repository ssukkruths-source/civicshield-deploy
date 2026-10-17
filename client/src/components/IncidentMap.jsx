import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, AlertCircle, ExternalLink, Calendar, Navigation } from 'lucide-react';

// Fix default Leaflet icon paths in bundler
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom HTML pin generator for urgency levels
function createCustomPin(urgency, status) {
  let color = '#0284c7'; // default blue
  let glow = 'rgba(2, 132, 199, 0.4)';

  if (status === 'Resolved') {
    color = '#0d9488'; // teal
    glow = 'rgba(13, 148, 136, 0.4)';
  } else if (urgency === 'Critical') {
    color = '#e11d48'; // red
    glow = 'rgba(225, 29, 72, 0.5)';
  } else if (urgency === 'Medium') {
    color = '#d97706'; // amber
    glow = 'rgba(217, 119, 6, 0.4)';
  }

  const html = `
    <div style="
      position: relative;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background-color: ${color};
        opacity: 0.3;
        animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
      "></div>
      <div style="
        position: relative;
        width: 18px;
        height: 18px;
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 0 10px ${glow};
      "></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-map-pin',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

// Subcomponent to adjust view when incidents change
function ChangeMapView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

export default function IncidentMap({ incidents, onSelectIncident }) {
  // Filter incidents with valid numeric coordinates
  const validIncidents = incidents.filter(
    (inc) =>
      inc.latitude != null &&
      inc.longitude != null &&
      !isNaN(inc.latitude) &&
      !isNaN(inc.longitude)
  );

  // Compute map center (default to first incident or New York metro coords)
  const defaultCenter =
    validIncidents.length > 0
      ? [validIncidents[0].latitude, validIncidents[0].longitude]
      : [40.7128, -74.006];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 mb-2 border-b border-slate-100 gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center space-x-2">
            <Navigation className="w-4 h-4 text-teal-600" />
            <span>Interactive Municipal Hazard Map</span>
          </h2>
          <p className="text-xs text-slate-500">
            Real-time geospatial locations of reported utility failures & hazards.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-3 text-[11px] text-slate-600 font-medium">
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block"></span>
            <span>Critical</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            <span>Medium</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span>
            <span>Low</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block"></span>
            <span>Resolved</span>
          </div>
        </div>
      </div>

      <div className="h-[420px] w-full rounded-xl overflow-hidden relative border border-slate-100">
        <MapContainer
          center={defaultCenter}
          zoom={13}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <ChangeMapView center={defaultCenter} zoom={13} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {validIncidents.map((incident) => {
            const customIcon = createCustomPin(incident.urgency, incident.status);
            return (
              <Marker
                key={incident.id}
                position={[incident.latitude, incident.longitude]}
                icon={customIcon}
              >
                <Popup className="civic-popup">
                  <div className="p-1 max-w-[240px]">
                    <div className="flex items-center justify-between text-[11px] mb-1 font-mono font-bold text-slate-500">
                      <span>{incident.reference_id}</span>
                      <span className={`px-1.5 py-0.2 rounded font-sans text-[10px] ${
                        incident.urgency === 'Critical' ? 'bg-rose-100 text-rose-700' :
                        incident.urgency === 'Medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-sky-100 text-sky-700'
                      }`}>
                        {incident.urgency}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-slate-900 leading-snug line-clamp-2">
                      {incident.title}
                    </h4>

                    <p className="text-[11px] text-slate-600 mt-1 flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{incident.landmark}, {incident.area}</span>
                    </p>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        incident.status === 'Resolved' ? 'bg-teal-100 text-teal-800' :
                        incident.status === 'Dispatched' ? 'bg-indigo-100 text-indigo-800' :
                        incident.status === 'On Site' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {incident.status}
                      </span>

                      <button
                        onClick={() => onSelectIncident(incident)}
                        className="text-[11px] font-semibold text-teal-600 hover:text-teal-800 flex items-center space-x-1"
                      >
                        <span>Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {validIncidents.length === 0 && (
        <div className="mt-2 text-center text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
          No incidents with GPS coordinates found for the current filter.
        </div>
      )}
    </div>
  );
}
