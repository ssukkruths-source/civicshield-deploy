import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  MapPin, 
  Navigation, 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldAlert, 
  Loader2, 
  Camera, 
  Flame, 
  Zap, 
  Droplets, 
  Construction, 
  Crosshair, 
  Layers,
  Sparkles
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../services/api.js';
import { soundFx } from '../services/soundFx.js';

const CATEGORIES = [
  'Fallen Electrical Cable',
  'Burst Water Main',
  'Open Sewer Manhole',
  'Damaged Road',
  'Streetlight Failure',
  'Other Infrastructure Hazard'
];

const PRESET_ZONES = [
  { name: 'Central Metro Exit', landmark: 'Front of Metro Station Gate 2', area: 'Downtown Core', lat: 37.7749, lng: -122.4194 },
  { name: 'Substation Overpass', landmark: 'Under elevated power lines, 4th Ave', area: 'East Utility Corridor', lat: 37.7833, lng: -122.4167 },
  { name: 'Riverfront Ward 4', landmark: 'Corner of Riverside Promenade & Elm St', area: 'South District', lat: 37.7650, lng: -122.4200 },
  { name: 'Highway 101 Overpass', landmark: 'Off-ramp bridge lane 1', area: 'West Freeway Sector', lat: 37.7550, lng: -122.4050 },
  { name: 'Tech Park Sector 7', landmark: 'Main boulevard roundabout', area: 'Innovation District', lat: 37.7890, lng: -122.4010 }
];

const SAMPLE_EVIDENCE_PHOTOS = [
  { label: 'Dangling Wire', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80' },
  { label: 'Burst Main Flood', url: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=600&auto=format&fit=crop&q=80' },
  { label: 'Broken Asphalt', url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80' }
];

// Interactive Map Click Handler component for Leaflet
function MapPinPicker({ position, onPositionChange }) {
  const map = useMapEvents({
    click(e) {
      soundFx.playClick();
      onPositionChange(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, map.getZoom(), { duration: 0.5 });
    }
  });

  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom(), { duration: 0.5 });
    }
  }, [position, map]);

  if (!position) return null;

  const pinIcon = L.divIcon({
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: #06b6d4; opacity: 0.4; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: relative; width: 16px; height: 16px; border-radius: 50%; background: #06b6d4; border: 3px solid #ffffff; box-shadow: 0 0 14px #06b6d4;"></div>
      </div>
    `,
    className: 'custom-picker-pin',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  return <Marker position={position} icon={pinIcon} />;
}

export default function ReportHazardModal({ isOpen, onClose, onSuccess, onViewIncident }) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Fallen Electrical Cable',
    description: '',
    landmark: '',
    area: '',
    latitude: '37.7749',
    longitude: '-122.4194',
    urgency: 'Medium',
    photo_url: '',
    reporter_contact: ''
  });

  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Handle browser geolocation
  const handleGetLocation = () => {
    soundFx.playClick();
    setGeoLoading(true);
    setGeoError('');

    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      setGeoLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        soundFx.playRadioChirp();
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setFormData(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          landmark: prev.landmark || 'Current User GPS Location',
          area: prev.area || 'Metro Area Zone'
        }));
        setGeoLoading(false);
      },
      (err) => {
        setGeoError('GPS unavailable. Click anywhere on the radar map to drop pin.');
        setGeoLoading(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleSelectPresetZone = (zone) => {
    soundFx.playRadioChirp();
    setFormData(prev => ({
      ...prev,
      landmark: zone.landmark,
      area: zone.area,
      latitude: zone.lat.toFixed(6),
      longitude: zone.lng.toFixed(6)
    }));
  };

  const handleMapPinChange = (lat, lng) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
      landmark: prev.landmark || `Hazard Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      area: prev.area || 'Geotagged Sector'
    }));
  };

  const handleUrgencyChange = (level) => {
    soundFx.playClick();
    setFormData(prev => ({ ...prev, urgency: level }));
  };

  // Handle local image file upload & convert to base64 DataURL preview
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (.jpg, .png, .webp).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Photo file size exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      soundFx.playClick();
      setFormData(prev => ({ ...prev, photo_url: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // Validate form before submission
  const validate = () => {
    const errs = {};
    if (!formData.title.trim() || formData.title.trim().length < 5) {
      errs.title = 'Hazard title must be at least 5 characters.';
    }
    if (!formData.description.trim() || formData.description.trim().length < 10) {
      errs.description = 'Please describe the hazard in detail (at least 10 characters).';
    }
    if (!formData.landmark.trim() || formData.landmark.trim().length < 3) {
      errs.landmark = 'Location landmark is required (or click the mini-map).';
    }
    if (!formData.area.trim() || formData.area.trim().length < 2) {
      errs.area = 'Area or sector is required.';
    }
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit report to backend
  const handleSubmit = async (e, forceSubmit = false) => {
    if (e) e.preventDefault();
    if (!validate()) {
      soundFx.playAlert();
      return;
    }

    setLoading(true);
    setDuplicateWarning(null);

    try {
      const payload = {
        ...formData,
        forceSubmit
      };

      const res = await api.createIncident(payload);
      soundFx.playSuccess();
      setSubmissionSuccess(res.data);
      if (onSuccess) onSuccess(res.data);
    } catch (err) {
      soundFx.playAlert();
      if (err.status === 409 && err.data?.isDuplicate) {
        setDuplicateWarning(err.data);
      } else {
        alert(err.message || 'Failed to submit report. Please check required fields.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyId = () => {
    if (submissionSuccess?.reference_id) {
      navigator.clipboard.writeText(submissionSuccess.reference_id);
      soundFx.playClick();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleResetAndClose = () => {
    soundFx.playClick();
    setSubmissionSuccess(null);
    setDuplicateWarning(null);
    setFormData({
      title: '',
      category: 'Fallen Electrical Cable',
      description: '',
      landmark: '',
      area: '',
      latitude: '37.7749',
      longitude: '-122.4194',
      urgency: 'Medium',
      photo_url: '',
      reporter_contact: ''
    });
    setValidationErrors({});
    onClose();
  };

  const currentPinPosition = [
    parseFloat(formData.latitude) || 37.7749,
    parseFloat(formData.longitude) || -122.4194
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-elevated border border-[#E4E9EF] text-[#172B3A] overflow-hidden my-6">
        
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-[#E4E9EF] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#E6F7F6] border border-[#B2EBE8] rounded-xl text-[#20A39E]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#E6F7F6] text-[#188B87] border border-[#B2EBE8]">
                  Citizen Hazard Intake
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-[#183B56] mt-0.5">
                Report Infrastructure Hazard
              </h2>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-2 rounded-lg text-[#697586] hover:text-[#183B56] hover:bg-[#F7F8FA] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[82vh] overflow-y-auto space-y-5">
          
          {/* ============================================================== */}
          {/* SUCCESS SCREEN */}
          {/* ============================================================== */}
          {submissionSuccess ? (
            <div className="text-center py-6 space-y-5">
              <div className="w-14 h-14 bg-[#EAF5EF] border border-[#C5E5D3] text-[#25855A] rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <span className="text-[11px] uppercase font-mono font-bold tracking-wider text-[#25855A]">
                  ✓ Dispatch Confirmed & Logged
                </span>
                <h3 className="text-xl font-bold text-[#183B56] mt-1">
                  Incident Submitted to Municipal Dispatch
                </h3>
                <p className="text-xs text-[#697586] max-w-md mx-auto mt-1 leading-relaxed">
                  Your hazard report has been recorded in the central municipal incident database and assigned to active field triage.
                </p>
              </div>

              {/* Reference ID Card */}
              <div className="bg-[#F7F8FA] border border-[#E4E9EF] rounded-xl p-5 max-w-md mx-auto space-y-2.5 shadow-2xs">
                <span className="text-[11px] font-bold text-[#697586] uppercase tracking-wider block">
                  Official Tracking Reference Code
                </span>
                <div className="flex items-center justify-center space-x-3">
                  <span className="text-2xl font-mono font-bold text-[#183B56] tracking-wider">
                    {submissionSuccess.reference_id}
                  </span>
                  <button
                    onClick={handleCopyId}
                    className="p-2 text-[#183B56] hover:text-[#20A39E] bg-white border border-[#E4E9EF] rounded-lg hover:bg-[#F7F8FA] shadow-2xs transition-colors"
                    title="Copy Reference ID"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-[#697586]">
                  Save this code to check real-time field crew deployment and photographic repair confirmation.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    const inc = submissionSuccess;
                    handleResetAndClose();
                    if (onViewIncident) onViewIncident(inc);
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#20A39E] hover:bg-[#188B87] text-white font-semibold rounded-lg text-xs flex items-center justify-center space-x-2 shadow-xs transition-colors"
                >
                  <span>Track Status Pipeline Now</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleResetAndClose}
                  className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-[#F7F8FA] text-[#183B56] font-semibold rounded-lg text-xs border border-[#E4E9EF] shadow-2xs transition-colors"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          ) : (
            /* ============================================================== */
            /* INTERACTIVE SUBMISSION FORM */
            /* ============================================================== */
            <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">

              {/* DUPLICATE WARNING INTERSTITIAL */}
              {duplicateWarning && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-900">
                        Active Incident Already Under Review at this Site
                      </h4>
                      <p className="text-xs text-amber-800 mt-0.5">
                        {duplicateWarning.reason}
                      </p>
                    </div>
                  </div>

                  {duplicateWarning.existingIncident && (
                    <div className="p-3 bg-white border border-amber-200 rounded-lg text-xs space-y-1 shadow-2xs">
                      <div className="flex justify-between font-mono font-bold text-amber-800">
                        <span>Ref: {duplicateWarning.existingIncident.reference_id}</span>
                        <span className="text-[#697586]">{duplicateWarning.existingIncident.status}</span>
                      </div>
                      <p className="font-semibold text-[#183B56]">{duplicateWarning.existingIncident.title}</p>
                      <p className="text-[#697586]">{duplicateWarning.existingIncident.landmark}, {duplicateWarning.existingIncident.area}</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const target = duplicateWarning.existingIncident;
                        handleResetAndClose();
                        if (onViewIncident && target) onViewIncident(target);
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-2xs"
                    >
                      View Existing Report
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSubmit(null, true)}
                      className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-[#F7F8FA] text-[#183B56] font-semibold rounded-lg text-xs border border-[#E4E9EF] transition-colors"
                    >
                      Submit Anyway (Separate Incident)
                    </button>
                  </div>
                </div>
              )}

              {/* 1. Hazard Title */}
              <div>
                <label className="block text-xs font-semibold text-[#183B56] mb-1">
                  Hazard Headline <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Live electrical cable fallen across sidewalk"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-lg bg-white border text-xs text-[#172B3A] placeholder-[#9AA4B2] focus:border-[#20A39E] focus:outline-hidden transition-all shadow-2xs ${
                    validationErrors.title ? 'border-rose-400 bg-rose-50/30' : 'border-[#E4E9EF]'
                  }`}
                />
                {validationErrors.title && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1">{validationErrors.title}</p>
                )}
              </div>

              {/* 2. Category & Urgency Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#183B56] mb-1">
                    Hazard Classification <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      soundFx.playClick();
                      setFormData({ ...formData, category: e.target.value });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E4E9EF] bg-white text-xs text-[#172B3A] font-medium focus:border-[#20A39E] focus:outline-hidden shadow-2xs"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#183B56] mb-1 flex items-center justify-between">
                    <span>Urgency Level <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-[#697586] font-mono">
                      {formData.urgency === 'Critical' ? 'Immediate Threat' : formData.urgency === 'Medium' ? 'High Priority' : 'Standard Queue'}
                    </span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Low', 'Medium', 'Critical'].map((level) => {
                      const isSelected = formData.urgency === level;
                      let activeStyle = '';
                      if (level === 'Critical') activeStyle = 'bg-rose-50 text-rose-700 border-rose-300 font-bold shadow-2xs';
                      if (level === 'Medium') activeStyle = 'bg-amber-50 text-amber-800 border-amber-300 font-bold shadow-2xs';
                      if (level === 'Low') activeStyle = 'bg-blue-50 text-blue-700 border-blue-300 font-bold shadow-2xs';

                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => {
                            soundFx.playClick();
                            setFormData({ ...formData, urgency: level });
                          }}
                          className={`py-2 px-2.5 rounded-lg text-xs border transition-all ${
                            isSelected
                              ? activeStyle
                              : 'bg-[#F7F8FA] border-[#E4E9EF] text-[#697586] hover:text-[#183B56] hover:bg-[#EEF2F6] font-medium'
                          }`}
                        >
                          {level}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 3. Description */}
              <div>
                <label className="block text-xs font-semibold text-[#183B56] mb-1">
                  Incident Conditions & Threats to Public <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows="3"
                  placeholder="Detail exact conditions: exposed wiring, sparking, flooding onto roadway, open deep manhole, or obstructed lanes..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-lg bg-white border text-xs text-[#172B3A] placeholder-[#9AA4B2] focus:border-[#20A39E] focus:outline-hidden transition-all shadow-2xs ${
                    validationErrors.description ? 'border-rose-400 bg-rose-50/30' : 'border-[#E4E9EF]'
                  }`}
                />
                {validationErrors.description && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1">{validationErrors.description}</p>
                )}
              </div>

              {/* 4. Interactive Leaflet Mini Pin-Picker Map */}
              <div className="p-4 bg-[#F7F8FA] rounded-xl border border-[#E4E9EF] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <Crosshair className="w-4 h-4 text-[#20A39E]" />
                    <span className="text-xs font-bold text-[#183B56]">Incident Coordinate Pinning</span>
                    <span className="text-[10px] text-[#697586]">(Click on map to drop precise pin)</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={geoLoading}
                    className="flex items-center space-x-1.5 text-xs font-semibold text-[#183B56] hover:text-[#20A39E] bg-white hover:bg-[#F7F8FA] border border-[#E4E9EF] shadow-2xs px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {geoLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#20A39E]" />
                        <span>Detecting GPS...</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="w-3.5 h-3.5 text-[#20A39E]" />
                        <span>Use My Location</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Quick Zone Presets */}
                <div className="flex items-center flex-wrap gap-1.5">
                  <span className="text-[10px] text-[#697586] uppercase font-bold tracking-wider mr-1">Quick Sectors:</span>
                  {PRESET_ZONES.map((zone) => (
                    <button
                      key={zone.name}
                      type="button"
                      onClick={() => handleSelectPresetZone(zone)}
                      className="text-[11px] px-2.5 py-1 rounded-md bg-white hover:bg-[#EEF2F6] text-[#183B56] border border-[#E4E9EF] shadow-2xs transition-colors font-medium"
                    >
                      {zone.name}
                    </button>
                  ))}
                </div>

                {/* Mini Leaflet Pin Dropper */}
                <div className="h-44 sm:h-48 w-full rounded-xl overflow-hidden border border-[#E4E9EF] relative shadow-2xs">
                  <MapContainer
                    center={currentPinPosition}
                    zoom={13}
                    scrollWheelZoom={false}
                    className="h-full w-full"
                    style={{ background: '#e5e7eb' }}
                  >
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                      attribution="&copy; OpenStreetMap contributors &copy; CARTO"
                    />
                    <MapPinPicker
                      position={currentPinPosition}
                      onPositionChange={handleMapPinChange}
                    />
                  </MapContainer>
                  
                  <div className="absolute bottom-2 left-2 z-[400] bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-md border border-[#E4E9EF] text-[10px] font-mono font-semibold text-[#183B56] flex items-center space-x-1.5 shadow-xs">
                    <MapPin className="w-3 h-3 text-[#20A39E]" />
                    <span>Lat: {formData.latitude} | Lng: {formData.longitude}</span>
                  </div>
                </div>

                {geoError && (
                  <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    {geoError}
                  </p>
                )}

                {/* Landmark & Area text inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#183B56] mb-1">
                      Street / Landmark <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Near City Hall Metro Exit 2"
                      value={formData.landmark}
                      onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg bg-white border text-xs text-[#172B3A] placeholder-[#9AA4B2] focus:border-[#20A39E] focus:outline-hidden transition-all shadow-2xs ${
                        validationErrors.landmark ? 'border-rose-400 bg-rose-50/30' : 'border-[#E4E9EF]'
                      }`}
                    />
                    {validationErrors.landmark && (
                      <p className="text-[11px] text-rose-500 font-medium mt-1">{validationErrors.landmark}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#183B56] mb-1">
                      Sector / Ward <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Downtown Sector 4"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg bg-white border text-xs text-[#172B3A] placeholder-[#9AA4B2] focus:border-[#20A39E] focus:outline-hidden transition-all shadow-2xs ${
                        validationErrors.area ? 'border-rose-400 bg-rose-50/30' : 'border-[#E4E9EF]'
                      }`}
                    />
                    {validationErrors.area && (
                      <p className="text-[11px] text-rose-500 font-medium mt-1">{validationErrors.area}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 5. Photo Evidence with Sample Presets */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#183B56]">
                  Visual Evidence Photo
                </label>

                {/* Quick Presets */}
                <div className="flex items-center flex-wrap gap-1.5 mb-1.5">
                  <span className="text-[10px] text-[#697586] font-medium">Sample Photos:</span>
                  {SAMPLE_EVIDENCE_PHOTOS.map((sample) => (
                    <button
                      key={sample.label}
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        setFormData({ ...formData, photo_url: sample.url });
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-md bg-[#F7F8FA] hover:bg-[#EEF2F6] text-[#183B56] hover:text-[#20A39E] border border-[#E4E9EF] transition-colors font-medium shadow-2xs"
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Paste image URL (https://...)"
                    value={formData.photo_url}
                    onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-lg bg-white border border-[#E4E9EF] text-xs text-[#172B3A] placeholder-[#9AA4B2] focus:border-[#20A39E] focus:outline-hidden shadow-2xs"
                  />
                  
                  <label className="cursor-pointer px-3 py-2 bg-white hover:bg-[#F7F8FA] border border-[#E4E9EF] rounded-lg text-xs font-semibold text-[#183B56] flex items-center space-x-1.5 shadow-2xs transition-colors">
                    <Upload className="w-3.5 h-3.5 text-[#20A39E]" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {formData.photo_url && (
                  <div className="mt-2 relative w-24 h-20 rounded-lg overflow-hidden border border-[#E4E9EF] group shadow-xs">
                    <img
                      src={formData.photo_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        setFormData({ ...formData, photo_url: '' });
                      }}
                      className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-md hover:bg-rose-600 transition-colors"
                      title="Remove image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* 6. Reporter Contact */}
              <div>
                <label className="block text-xs font-semibold text-[#183B56] mb-1">
                  Reporter Contact (Optional for Dispatch SMS updates)
                </label>
                <input
                  type="text"
                  placeholder="Optional contact phone or email"
                  value={formData.reporter_contact}
                  onChange={(e) => setFormData({ ...formData, reporter_contact: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg bg-white border border-[#E4E9EF] text-xs text-[#172B3A] placeholder-[#9AA4B2] focus:border-[#20A39E] focus:outline-hidden shadow-2xs"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#E4E9EF]">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-[#697586] hover:text-[#183B56] hover:bg-[#F7F8FA] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-[#20A39E] hover:bg-[#188B87] disabled:opacity-50 flex items-center space-x-2 shadow-xs transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Validating & Dispatching...</span>
                    </>
                  ) : (
                    <span>Submit Hazard to Command</span>
                  )}
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  );
}

