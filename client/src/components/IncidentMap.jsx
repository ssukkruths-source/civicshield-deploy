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
  Sparkles
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
  googleHybrid: {
    name: 'Google Satellite',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps Satellite'
  },
  googleStreets: {
    name: 'Google Streets',
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps'
  },
  dark: {
    name: 'Tactical Dark Ops',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CartoDB &copy; OpenStreetMap contributors'
  },
  satellite: {
    name: 'Esri Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri'
  },
  streets: {
    name: 'Clean Positron',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CartoDB'
  }
};

// Create custom clean institutional markers
function createCustomMarkerIcon(urgency, status, isSelected = false) {
  let mainColor = '#0ea5e9'; // Sky blue default
  let rippleClass = 'pulse-ring-active';

  if (status === 'Resolved') {
    mainColor = '#10b981'; // Emerald
    rippleClass = '';
  } else if (urgency === 'Critical') {
    mainColor = '#ef4444'; // Red
    rippleClass = 'pulse-ring-critical';
  } else if (urgency === 'Medium') {
    mainColor = '#f59e0b'; // Amber
    rippleClass = 'pulse-ring-medium';
  }

  const borderStyle = isSelected ? 'border: 3px solid #ffffff; transform: scale(1.2);' : 'border: 2px solid #ffffff;';

  const html = `
    <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
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
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
      "></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-hazard-pin',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
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
        background: #3b82f6;
        opacity: 0.5;
        pointer-events: none;
      "></div>
      <div style="
        position: relative;
        width: 16px;
        height: 16px;
        background-color: #2563eb;
        border: 2.5px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 0 14px rgba(37, 99, 235, 0.8);
      "></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'user-location-pin',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}

// Map Controller for programmatically flying or fitting bounds
function MapController({ targetCenter, targetZoom, fitBoundsList }) {
  const map = useMap();

  useEffect(() => {
    if (targetCenter) {
      map.flyTo(targetCenter, targetZoom || 15, {
        duration: 1.4,
        easeLinearity: 0.25
      });
    }
  }, [targetCenter, targetZoom, map]);

  useEffect(() => {
    if (fitBoundsList && fitBoundsList.length > 0) {
      const bounds = L.latLngBounds(fitBoundsList.map(item => [item.latitude, item.longitude]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [fitBoundsList, map]);

  return null;
}

export default function IncidentMap({ 
  incidents: initialIncidents = [], 
  onSelectIncident,
  onIncidentUpdated,
  focusedIncident = null
}) {
  const [incidents, setIncidents] = useState(initialIncidents);
  const [activeTileStyle, setActiveTileStyle] = useState('googleHybrid');
  const [filterUrgency, setFilterUrgency] = useState('ALL');
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [isLiveSync, setIsLiveSync] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());
  const [syncCountdown, setSyncCountdown] = useState(5);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [flyTarget, setFlyTarget] = useState(null);
  const [fitRequest, setFitRequest] = useState(null);
  const [liveBanner, setLiveBanner] = useState('');
  const prevIncidentCountRef = useRef(initialIncidents.length);

  // Sync with initialIncidents prop
  useEffect(() => {
    setIncidents(initialIncidents);
  }, [initialIncidents]);

  // Handle external focusedIncident trigger from cards or dashboard
  useEffect(() => {
    if (focusedIncident && focusedIncident.latitude && focusedIncident.longitude) {
      const lat = parseFloat(focusedIncident.latitude);
      const lng = parseFloat(focusedIncident.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        setFlyTarget([lat, lng]);
        setSelectedIncident(focusedIncident);
      }
    }
  }, [focusedIncident]);

  // Live Auto-Poll Timer (every 5 seconds)
  useEffect(() => {
    if (!isLiveSync) return;

    const countdownInterval = setInterval(() => {
      setSyncCountdown((prev) => (prev <= 1 ? 5 : prev - 1));
    }, 1000);

    const pollInterval = setInterval(async () => {
      try {
        const res = await api.getIncidents({ limit: 100 });
        if (res && res.data) {
          const fresh = res.data;
          // Check if new incident appeared
          if (fresh.length > prevIncidentCountRef.current) {
            const newest = fresh[0];
            setLiveBanner(`⚡ Live Alert: New hazard logged "${newest.title}" in ${newest.area}`);
            setTimeout(() => setLiveBanner(''), 7000);
            if (onIncidentUpdated) onIncidentUpdated();
          }
          prevIncidentCountRef.current = fresh.length;
          setIncidents(fresh);
          setLastSyncTime(new Date());
        }
      } catch (err) {
        console.warn('Live map poll skipped:', err.message);
      }
    }, 5000);

    return () => {
      clearInterval(countdownInterval);
      clearInterval(pollInterval);
    };
  }, [isLiveSync, onIncidentUpdated]);

  // Filter valid incidents with GPS
  const validIncidents = incidents.filter(
    (inc) =>
      inc.latitude != null &&
      inc.longitude != null &&
      !isNaN(Number(inc.latitude)) &&
      !isNaN(Number(inc.longitude))
  );

  // Apply map-level urgency filter
  const displayedIncidents = validIncidents.filter((inc) => {
    if (filterUrgency === 'ALL') return true;
    if (filterUrgency === 'RESOLVED') return inc.status === 'Resolved';
    if (filterUrgency === 'CRITICAL') return inc.urgency === 'Critical' && inc.status !== 'Resolved';
    if (filterUrgency === 'ACTIVE') return inc.status !== 'Resolved' && inc.status !== 'Rejected';
    return true;
  });

  // Calculate Center
  const defaultCenter = validIncidents.length > 0
    ? [Number(validIncidents[0].latitude), Number(validIncidents[0].longitude)]
    : [40.7128, -74.006];

  // Geolocation trigger
  const handleLocateMe = () => {
    setLocating(true);
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        setFlyTarget({ center: coords, zoom: 15 });
        setLocating(false);
      },
      (err) => {
        alert('Could not acquire your location. Please check browser permissions.');
        setLocating(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Fit all markers
  const handleFitAll = () => {
    if (displayedIncidents.length > 0) {
      setFitRequest([...displayedIncidents]);
    }
  };

  // Manual Trigger Sync
  const handleManualSync = async () => {
    try {
      const res = await api.getIncidents({ limit: 100 });
      if (res && res.data) {
        setIncidents(res.data);
        setLastSyncTime(new Date());
        setSyncCountdown(5);
      }
    } catch (e) {
      console.warn('Sync failed:', e.message);
    }
  };

  const criticalCount = validIncidents.filter(i => i.urgency === 'Critical' && i.status !== 'Resolved').length;
  const activeCount = validIncidents.filter(i => i.status !== 'Resolved' && i.status !== 'Rejected').length;
  const resolvedCount = validIncidents.filter(i => i.status === 'Resolved').length;

  return (
    <div className={`relative transition-all duration-300 ${
      isFullscreen 
        ? 'fixed inset-0 z-50 bg-[#0b0f17] p-4' 
        : 'rounded-lg border border-[#1e293b] shadow-xl bg-[#111726] p-4 sm:p-5 overflow-hidden'
    }`}>
      
      {/* Live Toast Notification Banner */}
      {liveBanner && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-rose-950/95 border border-rose-800 text-rose-200 px-3.5 py-1.5 rounded-md shadow-xl flex items-center space-x-2 text-xs font-medium">
          <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span>{liveBanner}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between pb-3.5 mb-3 border-b border-[#1e293b] gap-3">
        
        {/* Map Header Status & Telemetry */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#172033] border border-[#26354d] rounded-md text-sky-400">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-semibold text-white">
                Geospatial Outage & Hazard Radar
              </h2>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-950 text-emerald-300 border border-emerald-800">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              <span>{displayedIncidents.length} geocoded incidents</span>
              <span className="mx-1.5">•</span>
              <span>Updated {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </p>
          </div>
        </div>

        {/* Center / Right Live Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
          
          {/* Urgency Filter Pills */}
          <div className="flex items-center bg-[#0d131f] p-0.5 rounded-md border border-[#1e293b] text-xs">
            <button
              onClick={() => setFilterUrgency('ALL')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                filterUrgency === 'ALL'
                  ? 'bg-[#1e293b] text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({validIncidents.length})
            </button>
            <button
              onClick={() => setFilterUrgency('CRITICAL')}
              className={`px-2 py-1 rounded text-[11px] font-medium flex items-center space-x-1 transition-colors ${
                filterUrgency === 'CRITICAL'
                  ? 'bg-red-950 text-red-200 border border-red-800'
                  : 'text-red-400 hover:text-red-300'
              }`}
            >
              <span>Critical ({criticalCount})</span>
            </button>
            <button
              onClick={() => setFilterUrgency('ACTIVE')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                filterUrgency === 'ACTIVE'
                  ? 'bg-amber-950 text-amber-200 border border-amber-800'
                  : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setFilterUrgency('RESOLVED')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                filterUrgency === 'RESOLVED'
                  ? 'bg-emerald-950 text-emerald-200 border border-emerald-800'
                  : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              Resolved ({resolvedCount})
            </button>
          </div>

          {/* Map Layer Style Switcher */}
          <div className="flex items-center bg-[#0d131f] p-0.5 rounded-md border border-[#1e293b] text-xs">
            <button
              onClick={() => setActiveTileStyle('googleHybrid')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                activeTileStyle === 'googleHybrid' ? 'bg-[#1e293b] text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setActiveTileStyle('googleStreets')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                activeTileStyle === 'googleStreets' ? 'bg-[#1e293b] text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Streets
            </button>
            <button
              onClick={() => setActiveTileStyle('dark')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                activeTileStyle === 'dark' ? 'bg-[#1e293b] text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Dark Ops
            </button>
          </div>

          {/* Action Buttons: Locate Me, Fit Bounds, Fullscreen */}
          <div className="flex items-center space-x-1">
            <button
              onClick={handleLocateMe}
              disabled={locating}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-teal-400 border border-slate-700 rounded-xl transition-colors shadow-xs"
              title="Locate My Zone"
            >
              <Crosshair className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleFitAll}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl transition-colors shadow-xs"
              title="Fit All Hazards"
            >
              <Navigation className="w-4 h-4 rotate-45" />
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl transition-colors shadow-xs"
              title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={handleManualSync}
              className="px-2.5 py-2 bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              title="Scan now"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span className="hidden sm:inline">Sync ({syncCountdown}s)</span>
            </button>
          </div>

        </div>
      </div>

      {/* Map Container Viewport */}
      <div className={`w-full rounded-2xl overflow-hidden relative border border-slate-800 shadow-inner ${
        isFullscreen ? 'h-[calc(100vh-140px)]' : 'h-[520px]'
      }`}>
        
        {/* Floating Top Radar HUD Status */}
        <div className="absolute top-3 left-3 z-30 pointer-events-none">
          <div className="glass-panel px-3 py-1.5 rounded-xl border border-slate-700/80 text-white flex items-center space-x-2 text-[11px] font-mono shadow-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="font-semibold text-emerald-400">DISPATCH RADAR ACTIVE</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-300">{displayedIncidents.length} Hazards Pinpointed</span>
          </div>
        </div>

        {/* Floating Legend Badge */}
        <div className="absolute top-3 right-3 z-30 hidden sm:flex items-center space-x-2 glass-panel px-3 py-1.5 rounded-xl border border-slate-700/80 text-[11px] font-medium text-slate-200 shadow-xl">
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/80"></span>
            <span>Critical</span>
          </div>
          <span>•</span>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/80"></span>
            <span>Medium</span>
          </div>
          <span>•</span>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/80"></span>
            <span>Low</span>
          </div>
          <span>•</span>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/80"></span>
            <span>Resolved</span>
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
                  <div className="text-xs text-white p-1">
                    <span className="font-bold text-blue-400 block mb-0.5">Your Position</span>
                    <span className="text-slate-300">GPS verified zone</span>
                  </div>
                </Popup>
              </Marker>
              <Circle
                center={userLocation}
                radius={250}
                pathOptions={{
                  color: '#3b82f6',
                  fillColor: '#3b82f6',
                  fillOpacity: 0.15,
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
                      color: '#f43f5e',
                      fillColor: '#f43f5e',
                      fillOpacity: 0.18,
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
                    <div className="p-1 max-w-[260px] text-white">
                      
                      {/* Reference ID & Urgency Pill */}
                      <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                        <span className="text-teal-400 font-bold">{incident.reference_id}</span>
                        <span className={`px-2 py-0.5 rounded-full font-sans text-[10px] font-bold ${
                          incident.urgency === 'Critical' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                          incident.urgency === 'Medium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                          'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        }`}>
                          {incident.urgency}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="font-bold text-xs text-white leading-snug line-clamp-2 mt-1">
                        {incident.title}
                      </h4>

                      {/* Category & Landmark */}
                      <div className="text-[11px] text-slate-300 mt-2 space-y-1">
                        <div className="flex items-center space-x-1.5 font-medium text-slate-200">
                          <CategoryIcon className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                          <span>{incident.category}</span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{incident.landmark}, {incident.area}</span>
                        </div>
                      </div>

                      {/* Status & CTA button */}
                      <div className="mt-3 pt-2 border-t border-slate-700/80 flex items-center justify-between">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          incident.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          incident.status === 'Dispatched' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                          incident.status === 'On Site' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          'bg-slate-700 text-slate-200'
                        }`}>
                          {incident.status}
                        </span>

                        <button
                          onClick={() => onSelectIncident(incident)}
                          className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-[10px] flex items-center space-x-1 transition-colors"
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

        {/* Floating Bottom Active Selection HUD Card */}
        {selectedIncident && (
          <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:max-w-md z-30">
            <div className="bg-[#111726] p-3.5 rounded-lg border border-[#26354d] text-white shadow-xl space-y-2">
              
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-semibold text-slate-300 bg-[#162032] px-2 py-0.5 rounded border border-[#22314a]">
                      {selectedIncident.reference_id}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded ${
                      selectedIncident.urgency === 'Critical' ? 'bg-red-950 text-red-300 border border-red-800' :
                      selectedIncident.urgency === 'Medium' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {selectedIncident.urgency}
                    </span>
                    <span className="text-xs text-slate-400">
                      {selectedIncident.status}
                    </span>
                  </div>
                  <h4 className="font-semibold text-xs text-white mt-1 line-clamp-1">
                    {selectedIncident.title}
                  </h4>
                </div>

                <button
                  onClick={() => setSelectedIncident(null)}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {selectedIncident.description}
              </p>

              <div className="flex items-center justify-between pt-1">
                <div className="text-xs text-slate-400 flex items-center space-x-1 truncate max-w-[200px]">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{selectedIncident.landmark}</span>
                </div>

                <button
                  onClick={() => onSelectIncident(selectedIncident)}
                  className="px-3 py-1 rounded-md text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 flex items-center space-x-1 transition-colors"
                >
                  <span>Inspect Ticket</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Footer Info / Empty Notice */}
      <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Live feed auto-refreshes seamlessly without page reload.</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-slate-400">Click any pulsing marker to inspect live dispatch status</span>
        </div>
      </div>

    </div>
  );
}
