import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  ShieldAlert, 
  Navigation, 
  ExternalLink,
  Calendar,
  FileText,
  UserCheck,
  Check,
  Copy,
  ChevronRight,
  Flame,
  ArrowRight
} from 'lucide-react';
import { getCategoryIcon, getStatusStyle, getUrgencyStyle, formatTimeAgo } from './IncidentCard.jsx';

const STATUS_STEPS = ['Submitted', 'Acknowledged', 'Dispatched', 'On Site', 'Resolved'];

export default function IncidentDetailsModal({ incident, onClose, onRefresh }) {
  const [copied, setCopied] = useState(false);

  if (!incident) return null;

  const CategoryIcon = getCategoryIcon(incident.category);

  const handleCopyId = () => {
    navigator.clipboard.writeText(incident.reference_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Determine current step index in lifecycle
  const currentStepIndex = STATUS_STEPS.indexOf(incident.status);
  const isRejected = incident.status === 'Rejected';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-500/20 border border-teal-500/40 rounded-xl">
              <ShieldAlert className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-teal-300 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800">
                  {incident.reference_id}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getUrgencyStyle(incident.urgency)}`}>
                  {incident.urgency} Urgency
                </span>
                {incident.is_demo && (
                  <span className="text-[10px] font-semibold uppercase bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">
                    Demo Record
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold brand-font text-white mt-1 line-clamp-1">
                {incident.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyId}
              className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
              title="Copy Reference ID"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">

          {/* ============================================================== */}
          {/* INCIDENT PROGRESS LIFECYCLE TIMELINE */}
          {/* ============================================================== */}
          <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Incident Response Lifecycle</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getStatusStyle(incident.status)}`}>
                Current Status: {incident.status}
              </span>
            </h4>

            {isRejected ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>This incident was reviewed and rejected as out-of-jurisdiction or not an infrastructure hazard.</span>
              </div>
            ) : (
              <div className="relative">
                {/* Connecting track line */}
                <div className="hidden sm:block absolute top-4 left-6 right-6 h-1 bg-slate-200 -z-0">
                  <div 
                    className="h-full bg-teal-600 transition-all duration-500"
                    style={{ 
                      width: `${Math.max(0, (currentStepIndex / (STATUS_STEPS.length - 1)) * 100)}%` 
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 relative z-10">
                  {STATUS_STEPS.map((step, idx) => {
                    const isDone = currentStepIndex >= idx;
                    const isCurrent = currentStepIndex === idx;

                    return (
                      <div key={step} className="flex sm:flex-col items-center sm:items-center space-x-2 sm:space-x-0 text-left sm:text-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xs transition-all ${
                          isCurrent
                            ? 'bg-teal-600 text-white ring-4 ring-teal-100 scale-110'
                            : isDone
                            ? 'bg-teal-700 text-white'
                            : 'bg-slate-200 text-slate-500'
                        }`}>
                          {isDone ? <Check className="w-4 h-4" /> : idx + 1}
                        </div>
                        <div className="mt-1">
                          <p className={`text-xs font-semibold ${isCurrent ? 'text-teal-900 font-bold' : isDone ? 'text-slate-800' : 'text-slate-400'}`}>
                            {step}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* MAIN DETAILS & MEDIA */}
          {/* ============================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Description & Notes (2 Cols) */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Hazard Description
                </h4>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200">
                  {incident.description}
                </p>
              </div>

              {/* On-Site Verification Notes */}
              {incident.verification_notes && (
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                  <span className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                    <span>Field Crew On-Site Assessment</span>
                  </span>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    {incident.verification_notes}
                  </p>
                </div>
              )}

              {/* Resolution Notes */}
              {incident.resolution_notes && (
                <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-xl space-y-1">
                  <span className="text-xs font-bold text-teal-900 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
                    <span>Resolution & Restoration Details</span>
                  </span>
                  <p className="text-xs text-teal-900 leading-relaxed">
                    {incident.resolution_notes}
                  </p>
                  {incident.resolved_at && (
                    <p className="text-[11px] text-teal-700 pt-1 font-medium">
                      Completed at: {new Date(incident.resolved_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Photo Evidence (Citizen or Completion) */}
              {(incident.photo_url || incident.resolution_photo_url) && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Visual Evidence Records
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {incident.photo_url && (
                      <div className="space-y-1">
                        <span className="text-[11px] text-slate-500 font-medium">Citizen Initial Report:</span>
                        <div className="h-40 rounded-xl overflow-hidden border border-slate-200 group relative">
                          <img 
                            src={incident.photo_url} 
                            alt="Initial Hazard" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                          />
                        </div>
                      </div>
                    )}
                    {incident.resolution_photo_url && (
                      <div className="space-y-1">
                        <span className="text-[11px] text-teal-700 font-medium">Field Crew Completion:</span>
                        <div className="h-40 rounded-xl overflow-hidden border border-teal-200 group relative">
                          <img 
                            src={incident.resolution_photo_url} 
                            alt="Resolved Work" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Incident Metadata Sidebar (1 Col) */}
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1.5">
                  Registry Information
                </h4>

                <div>
                  <span className="text-slate-400 block text-[11px]">Category</span>
                  <div className="flex items-center space-x-1.5 mt-0.5 font-medium text-slate-800">
                    <CategoryIcon className="w-3.5 h-3.5 text-teal-600" />
                    <span>{incident.category}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Landmark & Sector</span>
                  <div className="flex items-start space-x-1.5 mt-0.5 font-medium text-slate-800">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{incident.landmark}, {incident.area}</span>
                  </div>
                </div>

                {incident.latitude && incident.longitude && (
                  <div>
                    <span className="text-slate-400 block text-[11px]">GPS Coordinates</span>
                    <p className="font-mono text-slate-700 text-[11px] mt-0.5">
                      {incident.latitude.toFixed(5)}, {incident.longitude.toFixed(5)}
                    </p>
                  </div>
                )}

                <div>
                  <span className="text-slate-400 block text-[11px]">Assigned Field Crew</span>
                  <p className="font-medium text-slate-800 mt-0.5">
                    {incident.assigned_crew_name || 'Unassigned (In Dispatch Queue)'}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Submission Time</span>
                  <p className="text-slate-700 mt-0.5">
                    {new Date(incident.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* ============================================================== */}
          {/* AUDIT LOG & STATUS TIMELINE HISTORY */}
          {/* ============================================================== */}
          <div className="border-t border-slate-200 pt-5">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-teal-600" />
              <span>Official Action Log & Status History</span>
            </h4>

            <div className="space-y-2.5">
              {incident.logs && incident.logs.length > 0 ? (
                incident.logs.map((log, idx) => (
                  <div 
                    key={log.id || idx}
                    className="p-3 bg-white rounded-xl border border-slate-200 flex items-start justify-between text-xs hover:border-slate-300 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-800">{log.actor_name}</span>
                        <span className="text-slate-400 text-[11px]">→</span>
                        <span className={`px-2 py-0.2 rounded-full font-semibold text-[10px] border ${getStatusStyle(log.new_status)}`}>
                          {log.new_status}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-snug">{log.notes}</p>
                    </div>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap pl-3">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl">
                  Initial submission logged. No additional dispatch logs recorded yet.
                </p>
              )}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-mono">
            ID: {incident.id}
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-xl text-xs transition-colors"
          >
            Close Details
          </button>
        </div>

      </div>
    </div>
  );
}
