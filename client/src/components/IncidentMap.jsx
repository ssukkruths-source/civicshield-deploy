import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { 
  Navigation, 
  MapPin, 
  AlertTriangle, 
  Flame, 
  Clock, 
  CheckCircle2, 
  ExternalLink, 
  Radio, 
  Layers, 
  Crosshair, 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  Volume2, 
  VolumeX, 
  Eye, 
  Zap, 
  Droplets, 
  Construction, 
  Lightbulb, 
  ShieldAlert,
  ArrowRight,
  Sparkles,
  X
} from 'lucide-react';
import { getCategoryIcon } from './IncidentCard.jsx';
import { api } from '../services/api.js';

// Fix Leaflet's default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Map Tile Styles
const TILE_LAYERS = {
  googleStreets: {
    name: 'Google Streets',
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps'
  },
  googleHybrid: {
    name: 'Google Satellite',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps Satellite'
  }
};

// Create custom clean institutional markers
function createCustomMarkerIcon(urgency, status, isSelected = false) {
  let mainColor = '#20A39E'; // Teal default
  let rippleClass = 'pulse-ring-active';

  if (status === 'Resolved') {
    mainColor = '#25855A'; // Green
    rippleClass = '';
  } else if (urgency === 'Critical') {
    mainColor = '#D64545'; // Critical Red
    rippleClass = 'pulse-ring-critical';
  } else if (urgency === 'Medium') {
    mainColor = '#D99A26'; // Warning Amber
    rippleClass = 'pulse-ring-medium';
  }

  const borderStyle = isSelected ? 'border: 3px solid #ffffff; transform: scale(1.25);' : 'border: 2px solid #ffffff;';

  const html = `
    <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
      ${rippleClass ? `
        <div class="${rippleClass}" style="
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: ${mainColor};
          opacity: 0.35;
          pointer-events: none;
        "></div>
      ` : ''}
      <div style="
        position: relative;
        width: ${isSelected ? '18px' : '14px'};
        height: ${isSelected ? '18px' : '14px'};
        background-color: ${mainColor};
        border-radius: 50%;
        ${borderStyle}
        box-shadow: 0 3px 8px rgba(24, 59, 86, 0.35);
      "></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-hazard-pin',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -14],
  });
}

// User location live radar pin
function createUserLocationIcon() {
  const html = `
    <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
      <div class="pulse-ring-active" style="
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: #356B8C;
        opacity: 0.45;
        pointer-events: none;
      "></div>
      <div style="
        position: relative;
        width: 16px;
        height: 16px;
        background-color: #183B56;
        border: 2.5px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(24, 59, 86, 0.4);
      "></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-user-location-pin',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}

// Map Controller Component to reactively fly to coordinates
function MapController({ targetCenter, targetZoom, fitBoundsList }) {
  const map = useMap();

  useEffect(() => {
    if (targetCenter && targetCenter[0] && targetCenter[1]) {
      map.flyTo(targetCenter, targetZoom || 15, {
        duration: 1.2,
        easeLinearity: 0.25
      });
    }
  }, [targetCenter, targetZoom, map]);

  useEffect(() => {
    if (fitBoundsList && fitBoundsList.length > 0) {
      try {
        const bounds = L.latLngBounds(fitBoundsList.map(item => [item.lat, item.lng]));
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        }
      } catch (err) {
        // Fallback gracefully
      }
    }
  }, [fitBoundsList, map]);

  return null;
}

export default function IncidentMap({ 
  incidents = [], 
  onSelectIncident, 
  onIncidentUpdated, 
  focusedIncident 
}) {
  const [activeTileStyle, setActiveTileStyle] = useState('googleStreets');
  const [filterUrgency, setFilterUrgency] = useState('ALL');
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [flyTarget, setFlyTarget] = useState(null);
  const [fitRequest, setFitRequest] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());
  const [syncCountdown, setSyncCountdown] = useState(15);

  // Filter out records without valid coordinates
  const validIncidents = incidents.filter(
    (inc) => inc.latitude != null && inc.longitude != null && !isNaN(Number(inc.latitude)) && !isNaN(Number(inc.longitude))
  );

  // Filter by Urgency / Status tab
  const displayedIncidents = validIncidents.filter((inc) => {
    if (filterUrgency === 'ALL') return true;
    if (filterUrgency === 'CRITICAL') return inc.urgency === 'Critical';
    if (filterUrgency === 'ACTIVE') return inc.status !== 'Resolved';
    if (filterUrgency === 'RESOLVED') return inc.status === 'Resolved';
    return true;
  });

  // Calculate default center coordinate
  const defaultCenter = [37.7749, -122.4194];

  // Handle external focus request (from card "Locate on map" button)
  useEffect(() => {
    if (focusedIncident && focusedIncident.latitude && focusedIncident.longitude) {
      const lat = Number(focusedIncident.latitude);
      const lng = Number(focusedIncident.longitude);
      setFlyTarget({ center: [lat, lng], zoom: 16 });
      setSelectedIncident(focusedIncident);
    }
  }, [focusedIncident]);

  // Periodic automatic sync countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setSyncCountdown((prev) => {
        if (prev <= 1) {
          setLastSyncTime(new Date());
          if (onIncidentUpdated) onIncidentUpdated();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onIncidentUpdated]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation([latitude, longitude]);
        setFlyTarget({ center: [latitude, longitude], zoom: 15 });
        setLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setLocating(false);
      },
      { timeout: 8000 }
    );
  };

  const handleFitAll = () => {
    if (displayedIncidents.length === 0) return;
    const coords = displayedIncidents.map(i => ({ lat: Number(i.latitude), lng: Number(i.longitude) }));
    setFitRequest([...coords]);
  };

  const handleManualSync = () => {
    setLastSyncTime(new Date());
    setSyncCountdown(15);
    if (onIncidentUpdated) onIncidentUpdated();
  };

  const criticalCount = validIncidents.filter(i => i.urgency === 'Critical' && i.status !== 'Resolved').length;
  const activeCount = validIncidents.filter(i => i.status !== 'Resolved').length;
  const resolvedCount = validIncidents.filter(i => i.status === 'Resolved').length;

  return (
    <div className={`space-y-3 transition-all ${isFullscreen ? 'fixed inset-0 z-50 bg-[#F7F8FA] p-4 sm:p-6 overflow-y-auto' : ''}`}>
      
      {/* Top Map Action Toolbar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E4E9EF] shadow-card flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        
        {/* Left Indicator */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-[#E6F7F6] border border-[#BCE8E6] flex items-center justify-center text-[#20A39E] shrink-0">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-[#183B56] leading-none">
                Geospatial Incident Radar
              </h2>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#F0FDF4] text-[#166534] border border-[#BCF0DA]">
                LIVE TELEMETRY
              </span>
            </div>
            <p className="text-xs text-[#697586] mt-1">
              <span>{displayedIncidents.length} geocoded incidents</span>
              <span className="mx-1.5">•</span>
              <span>Updated {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </p>
          </div>
        </div>

        {/* Center / Right Live Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
          
          {/* Urgency Filter Pills */}
          <div className="flex items-center bg-[#F0F4F8] p-1 rounded-xl border border-[#E4E9EF] text-xs">
            <button
              onClick={() => setFilterUrgency('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterUrgency === 'ALL'
                  ? 'bg-white text-[#183B56] shadow-xs'
                  : 'text-[#697586] hover:text-[#172B3A]'
              }`}
            >
              All ({validIncidents.length})
            </button>
            <button
              onClick={() => setFilterUrgency('CRITICAL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterUrgency === 'CRITICAL'
                  ? 'bg-[#FDF2F2] text-[#D64545] border border-[#F8B4B4] shadow-xs'
                  : 'text-[#D64545] hover:text-[#b91c1c]'
              }`}
            >
              Critical ({criticalCount})
            </button>
            <button
              onClick={() => setFilterUrgency('ACTIVE')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterUrgency === 'ACTIVE'
                  ? 'bg-[#FEF9EE] text-[#D99A26] border border-[#F9DE9E] shadow-xs'
                  : 'text-[#D99A26] hover:text-[#b45309]'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setFilterUrgency('RESOLVED')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterUrgency === 'RESOLVED'
                  ? 'bg-[#F0FDF4] text-[#166534] border border-[#BCF0DA] shadow-xs'
                  : 'text-[#25855A] hover:text-[#166534]'
              }`}
            >
              Resolved ({resolvedCount})
            </button>
          </div>

          {/* Map Layer Style Switcher */}
          <div className="flex items-center bg-[#F0F4F8] p-1 rounded-xl border border-[#E4E9EF] text-xs">
            <button
              onClick={() => setActiveTileStyle('googleStreets')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeTileStyle === 'googleStreets' ? 'bg-white text-[#183B56] shadow-xs' : 'text-[#697586] hover:text-[#172B3A]'
              }`}
            >
              Streets
            </button>
            <button
              onClick={() => setActiveTileStyle('googleHybrid')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeTileStyle === 'googleHybrid' ? 'bg-white text-[#183B56] shadow-xs' : 'text-[#697586] hover:text-[#172B3A]'
              }`}
            >
              Satellite
            </button>
          </div>

          {/* Action Buttons: Locate Me, Fit Bounds, Fullscreen */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleLocateMe}
              disabled={locating}
              className="p-2 bg-white hover:bg-[#F7F8FA] text-[#20A39E] border border-[#E4E9EF] hover:border-[#CBD5E1] rounded-xl transition-all shadow-xs"
              title="Locate My Zone (GPS)"
            >
              <Crosshair className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleFitAll}
              className="p-2 bg-white hover:bg-[#F7F8FA] text-[#183B56] border border-[#E4E9EF] hover:border-[#CBD5E1] rounded-xl transition-all shadow-xs"
              title="Fit All Hazards into View"
            >
              <Navigation className="w-4 h-4 rotate-45" />
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 bg-white hover:bg-[#F7F8FA] text-[#183B56] border border-[#E4E9EF] hover:border-[#CBD5E1] rounded-xl transition-all shadow-xs"
              title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={handleManualSync}
              className="px-3 py-1.5 bg-[#E6F7F6] hover:bg-[#D3F2F0] text-[#156965] border border-[#BCE8E6] rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-xs"
              title="Scan now"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#20A39E]" />
              <span className="hidden sm:inline">Sync ({syncCountdown}s)</span>
            </button>
          </div>

        </div>
      </div>

      {/* Map Container Viewport */}
      <div className={`w-full rounded-2xl overflow-hidden relative border border-[#E4E9EF] shadow-panel ${
        isFullscreen ? 'h-[calc(100vh-140px)]' : 'h-[520px]'
      }`}>
        
        {/* Floating Top Radar HUD Status */}
        <div className="absolute top-3 left-3 z-30 pointer-events-none">
          <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#E4E9EF] text-[#183B56] flex items-center space-x-2 text-xs font-mono shadow-md">
            <span className="w-2 h-2 rounded-full bg-[#20A39E] animate-ping"></span>
            <span className="font-bold text-[#183B56]">RADAR LIVE</span>
            <span className="text-[#CBD5E1]">|</span>
            <span className="text-[#697586] font-sans font-medium">{displayedIncidents.length} Hazards Active</span>
          </div>
        </div>

        {/* Floating Legend Badge */}
        <div className="absolute top-3 right-3 z-30 hidden sm:flex items-center space-x-2.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#E4E9EF] text-xs font-medium text-[#172B3A] shadow-md">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D64545]"></span>
            <span className="text-xs">Critical</span>
          </div>
          <span className="text-[#CBD5E1]">•</span>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D99A26]"></span>
            <span className="text-xs">Medium</span>
          </div>
          <span className="text-[#CBD5E1]">•</span>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#20A39E]"></span>
            <span className="text-xs">Active</span>
          </div>
          <span className="text-[#CBD5E1]">•</span>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#25855A]"></span>
            <span className="text-xs">Resolved</span>
          </div>
        </div>

        {/* Leaflet Map */}
        <MapContainer
          center={defaultCenter}
          zoom={13}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          <MapController 
            targetCenter={flyTarget?.center} 
            targetZoom={flyTarget?.zoom} 
            fitBoundsList={fitRequest} 
          />

          <TileLayer
            key={activeTileStyle}
            url={TILE_LAYERS[activeTileStyle].url}
            attribution={TILE_LAYERS[activeTileStyle].attribution}
            maxZoom={19}
          />

          {/* User Location Marker & Circle */}
          {userLocation && (
            <>
              <Marker position={userLocation} icon={createUserLocationIcon()}>
                <Popup>
                  <div className="text-xs p-1">
                    <span className="font-bold text-[#183B56] block mb-0.5">Your Position</span>
                    <span className="text-[#697586]">GPS verified zone</span>
                  </div>
                </Popup>
              </Marker>
              <Circle
                center={userLocation}
                radius={250}
                pathOptions={{
                  color: '#20A39E',
                  fillColor: '#20A39E',
                  fillOpacity: 0.12,
                  weight: 1.5
                }}
              />
            </>
          )}

          {/* Incident Pins */}
          {displayedIncidents.map((incident) => {
            const isSelected = selectedIncident?.id === incident.id;
            const markerIcon = createCustomMarkerIcon(incident.urgency, incident.status, isSelected);
            const CategoryIcon = getCategoryIcon(incident.category);

            return (
              <React.Fragment key={incident.id}>
                {/* Critical Radiating Safety Zone on Map */}
                {incident.urgency === 'Critical' && incident.status !== 'Resolved' && (
                  <Circle
                    center={[Number(incident.latitude), Number(incident.longitude)]}
                    radius={140}
                    pathOptions={{
                      color: '#D64545',
                      fillColor: '#D64545',
                      fillOpacity: 0.14,
                      weight: 1.5,
                      dashArray: '4, 4'
                    }}
                  />
                )}

                <Marker
                  position={[Number(incident.latitude), Number(incident.longitude)]}
                  icon={markerIcon}
                  eventHandlers={{
                    click: () => {
                      setSelectedIncident(incident);
                    }
                  }}
                >
                  <Popup className="civic-popup">
                    <div className="p-1 max-w-[260px] text-[#172B3A]">
                      
                      {/* Reference ID & Urgency Pill */}
                      <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                        <span className="text-[#183B56] font-bold">{incident.reference_id}</span>
                        <span className={`px-2 py-0.5 rounded-full font-sans text-[10px] font-bold ${
                          incident.urgency === 'Critical' ? 'bg-[#FDF2F2] text-[#D64545] border border-[#F8B4B4]' :
                          incident.urgency === 'Medium' ? 'bg-[#FEF9EE] text-[#D99A26] border border-[#F9DE9E]' :
                          'bg-[#F0F6FA] text-[#356B8C] border border-[#D0E1ED]'
                        }`}>
                          {incident.urgency}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="font-bold text-xs text-[#183B56] leading-snug line-clamp-2 mt-1">
                        {incident.title}
                      </h4>

                      {/* Category & Landmark */}
                      <div className="text-[11px] text-[#697586] mt-2 space-y-1">
                        <div className="flex items-center space-x-1.5 font-medium text-[#172B3A]">
                          <CategoryIcon className="w-3.5 h-3.5 text-[#20A39E] shrink-0" />
                          <span>{incident.category}</span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-[#697586]">
                          <MapPin className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                          <span className="truncate">{incident.landmark}, {incident.area}</span>
                        </div>
                      </div>

                      {/* Status & CTA button */}
                      <div className="mt-3 pt-2 border-t border-[#E4E9EF] flex items-center justify-between">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          incident.status === 'Resolved' ? 'bg-[#F0FDF4] text-[#166534] border border-[#BCF0DA]' :
                          incident.status === 'Dispatched' ? 'bg-[#E6F7F6] text-[#156965] border border-[#BCE8E6]' :
                          incident.status === 'On Site' ? 'bg-[#FEF9EE] text-[#B45309] border border-[#F9DE9E]' :
                          'bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]'
                        }`}>
                          {incident.status}
                        </span>

                        <button
                          onClick={() => onSelectIncident(incident)}
                          className="px-2.5 py-1 rounded-lg bg-[#20A39E] hover:bg-[#177e7a] text-white font-semibold text-[10px] flex items-center space-x-1 transition-all shadow-xs"
                        >
                          <span>Full Audit</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>

                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}
        </MapContainer>

        {/* Floating Bottom Active Selection Card */}
        {selectedIncident && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-30 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="bg-white p-4 rounded-xl border border-[#E4E9EF] text-[#172B3A] shadow-elevated space-y-2.5">
              
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-semibold text-[#183B56] bg-[#F0F4F8] px-2 py-0.5 rounded-md border border-[#E4E9EF]">
                      {selectedIncident.reference_id}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      selectedIncident.urgency === 'Critical' ? 'bg-[#FDF2F2] text-[#D64545] border border-[#F8B4B4]' :
                      selectedIncident.urgency === 'Medium' ? 'bg-[#FEF9EE] text-[#D99A26] border border-[#F9DE9E]' :
                      'bg-[#F0F6FA] text-[#356B8C] border border-[#D0E1ED]'
                    }`}>
                      {selectedIncident.urgency}
                    </span>
                    <span className="text-xs text-[#697586] font-medium">
                      {selectedIncident.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-[#183B56] mt-1.5 line-clamp-1">
                    {selectedIncident.title}
                  </h4>
                </div>

                <button
                  onClick={() => setSelectedIncident(null)}
                  className="p-1 text-[#94A3B8] hover:text-[#172B3A] rounded-lg hover:bg-[#F0F4F8] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[#697586] line-clamp-2 leading-relaxed">
                {selectedIncident.description}
              </p>

              <div className="flex items-center justify-between pt-1">
                <div className="text-xs text-[#697586] flex items-center space-x-1.5 truncate max-w-[200px]">
                  <MapPin className="w-3.5 h-3.5 text-[#356B8C] shrink-0" />
                  <span className="truncate">{selectedIncident.landmark}</span>
                </div>

                <button
                  onClick={() => onSelectIncident(selectedIncident)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#20A39E] hover:bg-[#177e7a] flex items-center space-x-1.5 transition-all shadow-xs"
                >
                  <span>Inspect Ticket</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Footer Info / Live sync line */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-[#697586] gap-2 px-1">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-[#25855A]"></span>
          <span>Live feed auto-refreshes seamlessly without page reload.</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Click any marker to inspect live municipal dispatch status.</span>
        </div>
      </div>

    </div>
  );
}
