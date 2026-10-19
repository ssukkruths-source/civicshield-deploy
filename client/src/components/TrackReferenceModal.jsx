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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-elevated border border-[#E4E9EF] text-[#172B3A] overflow-hidden my-6">
        
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-[#E4E9EF] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#E6F7F6] border border-[#B2EBE8] rounded-xl text-[#20A39E]">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#183B56]">Track Incident Reference ID</h3>
              <p className="text-[11px] text-[#697586]">Municipal Dispatch Registry</p>
            </div>
          </div>
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-2 rounded-lg text-[#697586] hover:text-[#183B56] hover:bg-[#F7F8FA] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-[#697586] leading-relaxed">
            Enter the tracking code issued at hazard submission to view real-time triage status, field crew deployment, and photographic resolution records.
          </p>

          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#183B56] mb-1">
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
                className="w-full px-4 py-2.5 rounded-lg bg-white border border-[#E4E9EF] font-mono text-sm tracking-wider uppercase text-[#183B56] placeholder-[#9AA4B2] focus:border-[#20A39E] focus:outline-hidden shadow-2xs transition-all"
                autoFocus
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center space-x-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  onClose();
                }}
                className="px-4 py-2 text-xs font-semibold text-[#697586] hover:text-[#183B56] hover:bg-[#F7F8FA] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 text-xs font-semibold bg-[#20A39E] hover:bg-[#188B87] text-white rounded-lg shadow-xs transition-colors flex items-center space-x-1.5 disabled:opacity-50"
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
          <div className="pt-3 border-t border-[#E4E9EF]">
            <span className="text-[11px] font-semibold text-[#697586] block mb-2">Recent Active Records:</span>
            <div className="flex flex-wrap gap-2">
              {['CS-2026-1001', 'CS-2026-1002', 'CS-2026-1003'].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => handleQuickSample(sample)}
                  className="px-2.5 py-1 text-[11px] font-mono font-medium bg-[#F7F8FA] hover:bg-[#EEF2F6] text-[#183B56] border border-[#E4E9EF] rounded-md shadow-2xs transition-colors"
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
