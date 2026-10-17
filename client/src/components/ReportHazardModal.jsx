import React, { useState } from 'react';
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
  Image as ImageIcon,
  Flame,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api.js';

const CATEGORIES = [
  'Fallen Electrical Cable',
  'Burst Water Main',
  'Open Sewer Manhole',
  'Damaged Road',
  'Streetlight Failure',
  'Other Infrastructure Hazard'
];

export default function ReportHazardModal({ isOpen, onClose, onSuccess, onViewIncident }) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Fallen Electrical Cable',
    description: '',
    landmark: '',
    area: '',
    latitude: '',
    longitude: '',
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
    setGeoLoading(true);
    setGeoError('');

    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser. Please enter landmark manually.');
      setGeoLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6)
        }));
        setGeoLoading(false);
      },
      (err) => {
        let msg = 'Location permission denied. Please enter landmark and area manually.';
        if (err.code === 2) msg = 'Location unavailable. Please enter landmark and area manually.';
        if (err.code === 3) msg = 'Location request timed out. Please enter landmark manually.';
        setGeoError(msg);
        setGeoLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
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
      errs.landmark = 'Location landmark is required (e.g., Near City Hall Metro Exit 2).';
    }
    if (!formData.area.trim() || formData.area.trim().length < 2) {
      errs.area = 'Area or sector is required (e.g., Downtown Ward 4).';
    }
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit report to backend
  const handleSubmit = async (e, forceSubmit = false) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setDuplicateWarning(null);

    try {
      const payload = {
        ...formData,
        forceSubmit
      };

      const res = await api.createIncident(payload);
      setSubmissionSuccess(res.data);
      if (onSuccess) onSuccess(res.data);
    } catch (err) {
      // Check if backend flagged duplicate
      if (err.status === 409 && err.data?.isDuplicate) {
        setDuplicateWarning(err.data);
      } else {
        alert(err.message || 'Failed to submit report. Please check required fields.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Copy reference ID to clipboard
  const handleCopyId = () => {
    if (submissionSuccess?.reference_id) {
      navigator.clipboard.writeText(submissionSuccess.reference_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleResetAndClose = () => {
    setSubmissionSuccess(null);
    setDuplicateWarning(null);
    setFormData({
      title: '',
      category: 'Fallen Electrical Cable',
      description: '',
      landmark: '',
      area: '',
      latitude: '',
      longitude: '',
      urgency: 'Medium',
      photo_url: '',
      reporter_contact: ''
    });
    setValidationErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-500/20 border border-teal-500/40 rounded-xl">
              <ShieldAlert className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold brand-font">Report Municipal Hazard</h2>
              <p className="text-xs text-slate-300">
                Official citizen dispatch line. Fast triage for public utility emergencies.
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          
          {/* ============================================================== */}
          {/* SUBMISSION CONFIRMATION SCREEN */}
          {/* ============================================================== */}
          {submissionSuccess ? (
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 brand-font">
                  Hazard Report Dispatched!
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Your incident has been registered in the municipal database and prioritized for field crew deployment.
                </p>
              </div>

              {/* Reference ID Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 max-w-md mx-auto space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Your Official Incident Reference ID
                </span>
                <div className="flex items-center justify-center space-x-3">
                  <span className="text-2xl font-mono font-extrabold text-teal-700 tracking-wider">
                    {submissionSuccess.reference_id}
                  </span>
                  <button
                    onClick={handleCopyId}
                    className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors shadow-xs"
                    title="Copy Reference ID"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Save this reference code to track live crew arrival & resolution notes.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                <button
                  onClick={() => {
                    const inc = submissionSuccess;
                    handleResetAndClose();
                    if (onViewIncident) onViewIncident(inc);
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl text-xs flex items-center justify-center space-x-2 shadow-sm transition-colors"
                >
                  <span>Track Status Now</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button
                  onClick={handleResetAndClose}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs transition-colors"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          ) : (
            /* ============================================================== */
            /* REPORT SUBMISSION FORM */
            /* ============================================================== */
            <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">

              {/* DUPLICATE WARNING MODAL INTERSTITIAL */}
              {duplicateWarning && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl space-y-3 animate-fade-in">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-900">
                        Possible Duplicate Report Detected
                      </h4>
                      <p className="text-xs text-amber-800 mt-0.5">
                        {duplicateWarning.reason}
                      </p>
                    </div>
                  </div>

                  {duplicateWarning.existingIncident && (
                    <div className="p-3 bg-white/90 border border-amber-200 rounded-xl text-xs space-y-1">
                      <div className="flex justify-between font-mono font-bold text-slate-700">
                        <span>Ref: {duplicateWarning.existingIncident.reference_id}</span>
                        <span className="text-amber-700">{duplicateWarning.existingIncident.status}</span>
                      </div>
                      <p className="font-semibold text-slate-800">{duplicateWarning.existingIncident.title}</p>
                      <p className="text-slate-500">{duplicateWarning.existingIncident.landmark}, {duplicateWarning.existingIncident.area}</p>
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
                      className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-xs transition-colors"
                    >
                      View Existing Report
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSubmit(null, true)}
                      className="w-full sm:w-auto px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-lg text-xs transition-colors"
                    >
                      Submit Anyway (Separate Incident)
                    </button>
                  </div>
                </div>
              )}

              {/* 1. Hazard Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hazard Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Live wire dangling over bus stop on 4th street"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all ${
                    validationErrors.title ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                  }`}
                />
                {validationErrors.title && (
                  <p className="text-[11px] text-rose-500 mt-1">{validationErrors.title}</p>
                )}
              </div>

              {/* 2. Category & Urgency Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hazard Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Urgency Level <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Low', 'Medium', 'Critical'].map((level) => {
                      const isSelected = formData.urgency === level;
                      let activeStyle = '';
                      if (level === 'Critical') activeStyle = 'bg-rose-600 text-white border-rose-600';
                      if (level === 'Medium') activeStyle = 'bg-amber-500 text-white border-amber-500';
                      if (level === 'Low') activeStyle = 'bg-sky-500 text-white border-sky-500';

                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setFormData({ ...formData, urgency: level })}
                          className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                            isSelected
                              ? activeStyle
                              : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {level}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 3. Detailed Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Detailed Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows="3"
                  placeholder="Describe severity, hazards to pedestrian/vehicle traffic, active leaks, sparking wires, or safety barricades needed..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all ${
                    validationErrors.description ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                  }`}
                />
                {validationErrors.description && (
                  <p className="text-[11px] text-rose-500 mt-0.5">{validationErrors.description}</p>
                )}
              </div>

              {/* 4. Location Landmark & Area/Sector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Location Landmark <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., In front of Central Metro Station Exit 2"
                    value={formData.landmark}
                    onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all ${
                      validationErrors.landmark ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                    }`}
                  />
                  {validationErrors.landmark && (
                    <p className="text-[11px] text-rose-500 mt-0.5">{validationErrors.landmark}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Area / Sector / Ward <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Downtown Sector 4 / Ward 12"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all ${
                      validationErrors.area ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                    }`}
                  />
                  {validationErrors.area && (
                    <p className="text-[11px] text-rose-500 mt-0.5">{validationErrors.area}</p>
                  )}
                </div>
              </div>

              {/* 5. Geolocation / GPS Coordinates */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                    <Navigation className="w-3.5 h-3.5 text-teal-600" />
                    <span>GPS Coordinates (Optional for Map Pin)</span>
                  </span>

                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={geoLoading}
                    className="flex items-center space-x-1 text-xs font-semibold text-teal-600 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1 rounded-lg transition-colors"
                  >
                    {geoLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Detecting GPS...</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Use My Location</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    step="any"
                    placeholder="Latitude (e.g. 40.7128)"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="Longitude (e.g. -74.0060)"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                {geoError && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-200">
                    ℹ️ {geoError}
                  </p>
                )}
              </div>

              {/* 6. Photo URL or File Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Evidence Photo (Upload or Image URL)
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    placeholder="Paste public image URL (https://...)"
                    value={formData.photo_url}
                    onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  
                  <label className="cursor-pointer px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 flex items-center space-x-1.5 transition-colors">
                    <Upload className="w-4 h-4 text-slate-500" />
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
                  <div className="mt-2 relative w-24 h-24 rounded-lg overflow-hidden border border-slate-300 group">
                    <img
                      src={formData.photo_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, photo_url: '' })}
                      className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-rose-600 transition-colors"
                      title="Remove image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* 7. Reporter Optional Contact */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone / Email (Optional for Dispatch SMS updates)
                </label>
                <input
                  type="text"
                  placeholder="Anonymous by default, or provide phone/email for updates"
                  value={formData.reporter_contact}
                  onChange={(e) => setFormData({ ...formData, reporter_contact: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 shadow-md shadow-teal-500/20 disabled:opacity-60 flex items-center space-x-2 transition-all transform active:scale-95"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying & Dispatching...</span>
                    </>
                  ) : (
                    <span>Submit Hazard Report</span>
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
