import React, { useState } from 'react';
import { X, Search, ShieldAlert, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../services/api.js';

export default function TrackReferenceModal({ isOpen, onClose, onFoundIncident }) {
  const [referenceId, setReferenceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    const cleanId = referenceId.trim().toUpperCase();
    if (!cleanId) {
      setError('Please enter a Reference ID (e.g., CS-2026-1001).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.getIncidentByReference(cleanId);
      if (res.data) {
        onClose();
        if (onFoundIncident) onFoundIncident(res.data);
      } else {
        setError(`No incident found with Reference ID '${cleanId}'.`);
      }
    } catch (err) {
      setError(err.message || `No incident found matching Reference ID '${cleanId}'.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Search className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-base brand-font">Track Hazard by Reference ID</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Enter the tracking code provided when your hazard report was submitted to view real-time municipal response updates.
          </p>

          <form onSubmit={handleSearch} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Incident Reference ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. CS-2026-1001"
                  value={referenceId}
                  onChange={(e) => {
                    setReferenceId(e.target.value);
                    setError('');
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-mono text-sm tracking-wider uppercase focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl flex items-center space-x-2 shadow-sm transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Searching Registry...</span>
                  </>
                ) : (
                  <>
                    <span>Track Incident</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Reference Links */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">
              Demo sample reference codes to try:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {['CS-2026-1001', 'CS-2026-1002', 'CS-2026-1003', 'CS-2026-1005'].map(sampleId => (
                <button
                  key={sampleId}
                  type="button"
                  onClick={() => setReferenceId(sampleId)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-mono text-[11px] transition-colors"
                >
                  {sampleId}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
