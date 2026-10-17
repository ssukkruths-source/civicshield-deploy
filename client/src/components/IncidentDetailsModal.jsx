import React, { useState, useEffect } from 'react';
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
  ArrowRight,
  Radio,
  Send,
  MessageSquare,
  Truck,
  Sparkles,
  Zap
} from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { getCategoryIcon, getStatusStyle, getUrgencyStyle, formatTimeAgo } from './IncidentCard.jsx';
import { soundFx } from '../services/soundFx.js';

const STATUS_STEPS = ['Submitted', 'Acknowledged', 'Dispatched', 'On Site', 'Resolved'];

export default function IncidentDetailsModal({ incident, onClose, onRefresh }) {
  const [copied, setCopied] = useState(false);
  const [hasVerified, setHasVerified] = useState(false);
  const [verifyCount, setVerifyCount] = useState(0);
  const [citizenNotes, setCitizenNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [showRadioChatter, setShowRadioChatter] = useState(true);

  if (!incident) return null;

  const storageKey = `cs_verified_${incident.id || incident.reference_id}`;

  useEffect(() => {
    // Load local verification state
    const alreadyVerified = localStorage.getItem(storageKey) === 'true';
    setHasVerified(alreadyVerified);
    setVerifyCount(incident.upvotes || (alreadyVerified ? 4 : 3));

    // Simulated community field notes
    setCitizenNotes([
      { id: 1, author: 'Citizen Reporter', time: '18 mins ago', text: 'Hazard still active. Cones visible around pedestrian path.' }
    ]);
  }, [incident]);

  const CategoryIcon = getCategoryIcon(incident.category);

  const handleCopyId = () => {
    soundFx.playClick();
    navigator.clipboard.writeText(incident.reference_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = () => {
    if (hasVerified) return;
    soundFx.playSuccess();
    setHasVerified(true);
    setVerifyCount(prev => prev + 1);
    localStorage.setItem(storageKey, 'true');
  };

  const handleAddCitizenNote = (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    soundFx.playRadioChirp();
    const noteObj = {
      id: Date.now(),
      author: 'You (Local Citizen)',
      time: 'Just now',
      text: newNote.trim()
    };
    setCitizenNotes([noteObj, ...citizenNotes]);
    setNewNote('');
  };

  // Determine current step index in lifecycle
  const currentStepIndex = STATUS_STEPS.indexOf(incident.status);
  const isRejected = incident.status === 'Rejected';

  const lat = parseFloat(incident.latitude) || 37.7749;
  const lng = parseFloat(incident.longitude) || -122.4194;
  const mapPos = [lat, lng];

  const markerPin = L.divIcon({
    html: `
      <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: #06b6d4; opacity: 0.45; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: relative; width: 16px; height: 16px; border-radius: 50%; background: #06b6d4; border: 2px solid #ffffff; box-shadow: 0 0 12px #06b6d4;"></div>
      </div>
    `,
    className: 'custom-modal-pin',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#111726] rounded-lg shadow-2xl border border-[#1e293b] text-white overflow-hidden my-6">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#0d131f] border-b border-[#1e293b] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-md text-blue-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-semibold text-blue-300 bg-blue-950/70 px-2 py-0.5 rounded border border-blue-800/60">
                  {incident.reference_id}
                </span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${getUrgencyStyle(incident.urgency)}`}>
                  {incident.urgency} Urgency
                </span>
                {incident.is_demo && (
                  <span className="text-[10px] uppercase font-medium bg-[#1e293b] text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                    Demo Record
                  </span>
                )}
              </div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-100 mt-1 line-clamp-1">
                {incident.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyId}
              className="p-1.5 text-slate-300 hover:text-white bg-[#0b0f17] hover:bg-[#1e293b] rounded-md transition-colors border border-[#1e293b]"
              title="Copy Reference ID"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-[#1e293b] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 max-h-[80vh] overflow-y-auto space-y-4">

          {/* ============================================================== */}
          {/* INCIDENT PROGRESS LIFECYCLE TIMELINE */}
          {/* ============================================================== */}
          <div className="p-3.5 bg-[#0b0f17] border border-[#1e293b] rounded-md">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Truck className="w-3.5 h-3.5 text-blue-400" />
                <span>Dispatch Pipeline Lifecycle</span>
              </span>
              <span className={`text-xs px-2 py-0.5 rounded font-medium border ${getStatusStyle(incident.status)}`}>
                Current Status: {incident.status}
              </span>
            </h4>

            {isRejected ? (
              <div className="p-2.5 bg-rose-950/30 border border-rose-800/40 rounded text-xs text-rose-300 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>This incident was reviewed and rejected as out-of-jurisdiction or not an infrastructure hazard.</span>
              </div>
            ) : (
              <div className="relative pt-1 pb-1">
                {/* Connecting track line */}
                <div className="hidden sm:block absolute top-6 left-6 right-6 h-0.5 bg-slate-800 -z-0">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-500"
                    style={{ 
                      width: `${Math.max(0, (currentStepIndex / (STATUS_STEPS.length - 1)) * 100)}%` 
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 relative z-10">
                  {STATUS_STEPS.map((step, idx) => {
                    const isDone = currentStepIndex >= idx;
                    const isCurrent = currentStepIndex === idx;

                    return (
                      <div key={step} className="flex sm:flex-col items-center sm:items-center space-x-2 sm:space-x-0 text-left sm:text-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                          isCurrent
                            ? 'bg-blue-600 text-white ring-2 ring-blue-500/40 font-bold'
                            : isDone
                            ? 'bg-blue-900 text-blue-200'
                            : 'bg-[#111726] border border-[#1e293b] text-slate-500'
                        }`}>
                          {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                        </div>
                        <div className="mt-1">
                          <p className={`text-[11px] font-medium ${isCurrent ? 'text-blue-300 font-semibold' : isDone ? 'text-slate-300' : 'text-slate-500'}`}>
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
          {/* TACTILE CITIZEN VERIFICATION ACTION BAR */}
          {/* ============================================================== */}
          <div className="p-3 bg-[#0b0f17] border border-[#1e293b] rounded-md flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-3 text-left">
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-md">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-200 block">
                  Community Hazard Verification
                </span>
                <span className="text-[11px] text-slate-400">
                  {verifyCount} local citizens have confirmed this public danger.
                </span>
              </div>
            </div>

            <button
              onClick={handleVerify}
              disabled={hasVerified}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center space-x-1.5 ${
                hasVerified
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 cursor-default'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {hasVerified ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Verified ({verifyCount})</span>
                </>
              ) : (
                <span>Confirm Hazard (+1)</span>
              )}
            </button>
          </div>

          {/* ============================================================== */}
          {/* MAIN DETAILS & MEDIA (2 Col Grid) */}
          {/* ============================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Description, Field Notes & Photos (2 Cols) */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Official Hazard Description
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed bg-[#0b0f17] p-3 rounded-md border border-[#1e293b]">
                  {incident.description}
                </p>
              </div>

              {/* On-Site Verification Notes */}
              {incident.verification_notes && (
                <div className="p-3 bg-[#0b0f17] border border-amber-800/40 rounded-md space-y-1">
                  <span className="text-xs font-semibold text-amber-300 flex items-center space-x-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Field Crew Triage Assessment</span>
                  </span>
                  <p className="text-xs text-amber-100/90 leading-relaxed">
                    {incident.verification_notes}
                  </p>
                </div>
              )}

              {/* Resolution Notes */}
              {incident.resolution_notes && (
                <div className="p-3 bg-[#0b0f17] border border-emerald-800/40 rounded-md space-y-1">
                  <span className="text-xs font-semibold text-emerald-300 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Resolution & Restoration Details</span>
                  </span>
                  <p className="text-xs text-emerald-100/90 leading-relaxed">
                    {incident.resolution_notes}
                  </p>
                  {incident.resolved_at && (
                    <p className="text-[11px] text-emerald-400 pt-1 font-medium">
                      Completed at: {new Date(incident.resolved_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Photo Evidence (Citizen or Completion) */}
              {(incident.photo_url || incident.resolution_photo_url) && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Visual Evidence Records
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {incident.photo_url && (
                      <div className="space-y-1">
                        <span className="text-[11px] text-slate-400 font-medium">Citizen Initial Report:</span>
                        <div className="h-36 rounded-md overflow-hidden border border-[#1e293b] group relative shadow-sm">
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
                        <span className="text-[11px] text-emerald-400 font-medium">Field Crew Completion Proof:</span>
                        <div className="h-36 rounded-md overflow-hidden border border-emerald-800/40 group relative shadow-sm">
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

              {/* Simulated Live Dispatch Radio Chatter */}
              <div className="p-3 bg-[#0b0f17] rounded-md border border-[#1e293b] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                    <Radio className="w-3.5 h-3.5 text-blue-400" />
                    <span>Dispatch Incident Telemetry Log</span>
                  </span>
                  <button
                    onClick={() => setShowRadioChatter(!showRadioChatter)}
                    className="text-[11px] text-blue-400 hover:text-blue-300"
                  >
                    {showRadioChatter ? 'Collapse' : 'Expand'}
                  </button>
                </div>

                {showRadioChatter && (
                  <div className="space-y-1 font-mono text-[11px] text-slate-400 bg-[#070b12] p-2.5 rounded border border-[#1e293b]">
                    <p><span className="text-blue-400">[13:05] Central Dispatch:</span> Incident {incident.reference_id} logged. Urgency: {incident.urgency}.</p>
                    <p><span className="text-amber-400">[13:12] Municipal Rapid Unit:</span> Acknowledged site at {incident.landmark}. Unit en route.</p>
                    {incident.status === 'Resolved' && (
                      <p><span className="text-emerald-400">[13:45] Site Supervisor:</span> Repairs finalized. Infrastructure hazard cleared.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Citizen Community Field Notes */}
              <div className="space-y-2 pt-1">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Citizen Live Updates & Field Notes</span>
                </h4>

                <form onSubmit={handleAddCitizenNote} className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Add an on-the-ground observation (e.g. repair truck just pulled up)..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-[#0b0f17] border border-[#1e293b] rounded-md text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-md text-xs flex items-center space-x-1 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post</span>
                  </button>
                </form>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {citizenNotes.map((note) => (
                    <div key={note.id} className="p-2 bg-[#0b0f17] rounded-md border border-[#1e293b] text-xs flex items-start justify-between">
                      <div>
                        <span className="font-semibold text-blue-300 text-[11px] block">{note.author}</span>
                        <p className="text-slate-300 mt-0.5">{note.text}</p>
                      </div>
                      <span className="text-[10px] text-slate-500 shrink-0">{note.time}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Sidebar Metadata & Live Mini Radar Map (1 Col) */}
            <div className="space-y-3">
              
              {/* Interactive Mini Radar Map */}
              <div className="bg-[#0b0f17] rounded-md border border-[#1e293b] overflow-hidden shadow-sm">
                <div className="p-2.5 bg-[#0d131f] border-b border-[#1e293b] flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    <span>Geospatial Radar Pin</span>
                  </span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                  >
                    <span>Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="h-40 w-full relative">
                  <MapContainer
                    center={mapPos}
                    zoom={14}
                    scrollWheelZoom={false}
                    className="h-full w-full"
                    style={{ background: '#070d19' }}
                  >
                    <TileLayer
                      url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                      attribution="&copy; Google Satellite"
                    />
                    <Marker position={mapPos} icon={markerPin} />
                  </MapContainer>
                </div>
              </div>

              {/* Registry Details Box */}
              <div className="p-3 bg-[#0b0f17] rounded-md border border-[#1e293b] space-y-2.5 text-xs">
                <h4 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] border-b border-[#1e293b] pb-1.5">
                  Registry Telemetry
                </h4>

                <div>
                  <span className="text-slate-400 block text-[11px]">Category</span>
                  <div className="flex items-center space-x-1.5 mt-0.5 font-medium text-white">
                    <CategoryIcon className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{incident.category}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Landmark & Sector</span>
                  <div className="flex items-start space-x-1.5 mt-0.5 font-medium text-slate-200">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{incident.landmark}, {incident.area}</span>
                  </div>
                </div>

                {incident.latitude != null && incident.longitude != null && !isNaN(Number(incident.latitude)) && (
                  <div>
                    <span className="text-slate-400 block text-[11px]">GPS Coordinates</span>
                    <p className="font-mono text-cyan-300 text-[11px] mt-0.5">
                      {Number(incident.latitude).toFixed(5)}, {Number(incident.longitude).toFixed(5)}
                    </p>
                  </div>
                )}

                <div>
                  <span className="text-slate-400 block text-[11px]">Assigned Municipal Crew</span>
                  <p className="font-medium text-slate-200 mt-0.5">
                    {incident.assigned_crew_name || '⚡ Rapid Utility Unit Delta-4'}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Submission Time</span>
                  <p className="text-slate-300 mt-0.5">
                    {new Date(incident.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

            </div>

          </div>

          {/* ============================================================== */}
          {/* AUDIT LOG & STATUS TIMELINE HISTORY */}
          {/* ============================================================== */}
          <div className="border-t border-slate-800/80 pt-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Official Action Log & Status History</span>
            </h4>

            <div className="space-y-2">
              {incident.logs && incident.logs.length > 0 ? (
                incident.logs.map((log, idx) => (
                  <div 
                    key={log.id || idx}
                    className="p-3 bg-slate-950/90 rounded-xl border border-slate-800 flex items-start justify-between text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white">{log.actor_name}</span>
                        <span className="text-slate-400 text-[11px]">→</span>
                        <span className={`px-2 py-0.2 rounded-full font-semibold text-[10px] border ${getStatusStyle(log.new_status)}`}>
                          {log.new_status}
                        </span>
                      </div>
                      <p className="text-slate-300 leading-snug">{log.notes}</p>
                    </div>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap pl-3">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic p-3 bg-slate-950/70 rounded-xl border border-slate-850">
                  Initial citizen submission logged. No additional dispatch logs recorded yet.
                </p>
              )}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-mono">
            REF: {incident.reference_id}
          </div>
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl text-xs border border-slate-700 transition-colors"
          >
            Close Details
          </button>
        </div>

      </div>
    </div>
  );
}
