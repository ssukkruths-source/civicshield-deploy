import React, { useState } from 'react';
import { X, Search, ShieldAlert, Loader2, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { api } from '../services/api.js';
import { soundFx } from '../services/soundFx.js';

export default function TrackReferenceModal({ isOpen, onClose, onFoundIncident }) {
  const [referenceId, setReferenceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    soundFx.playClick();
    const cleanId = referenceId.trim().toUpperCase();
    if (!cleanId) {
      setError('Please enter a Reference ID (e.g., CS-2026-1001).');
      soundFx.playAlert();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.getIncidentByReference(cleanId);
      if (res.data) {
        soundFx.playSuccess();
        onClose();
        if (onFoundIncident) onFoundIncident(res.data);
      } else {
        soundFx.playAlert();
        setError(`No incident found with Reference ID '${cleanId}'.`);
      }
    } catch (err) {
      soundFx.playAlert();
      setError(err.message || `No incident found matching Reference ID '${cleanId}'.`);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSample = (sampleId) => {
    soundFx.playClick();
    setReferenceId(sampleId);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-[#111726] rounded-lg shadow-2xl border border-[#1e293b] text-white overflow-hidden my-6">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#0d131f] border-b border-[#1e293b] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-md text-blue-400">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-100">Track Incident Reference ID</h3>
              <p className="text-[11px] text-slate-400">Municipal Dispatch Registry</p>
            </div>
          </div>
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-[#1e293b] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Enter the tracking code issued at hazard submission to view real-time triage status, field crew deployment, and photographic resolution records.
          </p>

          <form onSubmit={handleSearch} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Incident Reference Code
              </label>
              <input
                type="text"
                placeholder="e.g. CS-2026-1001"
                value={referenceId}
                onChange={(e) => {
                  setReferenceId(e.target.value);
                  setError('');
                }}
                className="w-full px-3 py-2 rounded-md bg-[#0b0f17] border border-[#1e293b] font-mono text-sm tracking-wider uppercase text-blue-300 placeholder-slate-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                autoFocus
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-md flex items-center space-x-2 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  onClose();
                }}
                className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-[#1e293b] rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors flex items-center space-x-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Locating...</span>
                  </>
                ) : (
                  <>
                    <span>Search Docket</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick test references */}
          <div className="pt-2 border-t border-[#1e293b]/70">
            <span className="text-[11px] text-slate-400 block mb-1.5">Recent Active Records:</span>
            <div className="flex flex-wrap gap-1.5">
              {['CS-2026-1001', 'CS-2026-1002', 'CS-2026-1003'].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => handleQuickSample(sample)}
                  className="px-2 py-1 text-[11px] font-mono bg-[#0b0f17] hover:bg-[#1e293b] text-slate-300 border border-[#1e293b] rounded transition-colors"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
