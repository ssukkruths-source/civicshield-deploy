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
  Zap,
  UserPlus,
  Loader2,
  Lock,
  ShieldCheck
} from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { getCategoryIcon, getStatusStyle, getUrgencyStyle, formatTimeAgo } from './IncidentCard.jsx';
import { soundFx } from '../services/soundFx.js';
import { api } from '../services/api.js';

const STATUS_STEPS = ['Submitted', 'Acknowledged', 'Dispatched', 'On Site', 'Resolved'];

export default function IncidentDetailsModal({ 
  incident, 
  onClose, 
  onRefresh,
  authUser,
  userRole = 'citizen',
  onQuickSwitchRole
}) {
  const [activeIncident, setActiveIncident] = useState(incident);
  const [copied, setCopied] = useState(false);
  const [hasVerified, setHasVerified] = useState(false);
  const [verifyCount, setVerifyCount] = useState(0);
  const [citizenNotes, setCitizenNotes] = useState([]);
  const [newNote, setNewNote] = useState('');

  // Operational Action States
  const [staffList, setStaffList] = useState([]);
  const [selectedCrewId, setSelectedCrewId] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionPhoto, setResolutionPhoto] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  
  // Toggles for inline action forms
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [showVerifyForm, setShowVerifyForm] = useState(false);
  const [showResolveForm, setShowResolveForm] = useState(false);

  useEffect(() => {
    setActiveIncident(incident);
  }, [incident]);

  if (!activeIncident) return null;

  const storageKey = `cs_verified_${activeIncident.id || activeIncident.reference_id}`;

  useEffect(() => {
    // Load local verification state
    const alreadyVerified = localStorage.getItem(storageKey) === 'true';
    setHasVerified(alreadyVerified);
    setVerifyCount(activeIncident.upvotes || (alreadyVerified ? 4 : 3));

    // Simulated community field notes
    setCitizenNotes([
      { id: 1, author: 'Citizen Reporter', time: '18 mins ago', text: 'Hazard still active. Cones visible around pedestrian path.' }
    ]);
  }, [activeIncident]);

  // Load field crew directory for assignment
  useEffect(() => {
    async function loadCrews() {
      try {
        const res = await api.getStaffDirectory();
        if (res && res.data) {
          setStaffList(res.data.filter(s => s.role === 'field_crew'));
        }
      } catch (err) {
        console.warn('Could not load staff directory in modal:', err);
      }
    }
    loadCrews();
  }, []);

  const CategoryIcon = getCategoryIcon(activeIncident.category);

  const handleCopyId = () => {
    soundFx.playClick();
    navigator.clipboard.writeText(activeIncident.reference_id);
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

  // Operational Action Handlers
  const handleAcknowledge = async () => {
    soundFx.playClick();
    setActionLoading(true);
    setActionError('');
    try {
      await api.updateStatus(activeIncident.id, 'Acknowledged', 'Incident reviewed by Dispatcher triage.');
      soundFx.playSuccess();
      setActionSuccess('Incident acknowledged by Central Dispatch.');
      const fresh = await api.getIncidentById(activeIncident.id);
      if (fresh && fresh.data) setActiveIncident(fresh.data);
      if (onRefresh) onRefresh();
      setTimeout(() => setActionSuccess(''), 3500);
    } catch (err) {
      setActionError(err.message || 'Failed to acknowledge incident.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignCrew = async () => {
    if (!selectedCrewId) {
      setActionError('Please select a certified field crew unit from the directory.');
      return;
    }
    soundFx.playClick();
    setActionLoading(true);
    setActionError('');
    try {
      await api.assignCrew(activeIncident.id, selectedCrewId);
      soundFx.playSuccess();
      setActionSuccess('Field crew assigned and dispatched to hazard site.');
      setShowAssignDropdown(false);
      setSelectedCrewId('');
      const fresh = await api.getIncidentById(activeIncident.id);
      if (fresh && fresh.data) setActiveIncident(fresh.data);
      if (onRefresh) onRefresh();
      setTimeout(() => setActionSuccess(''), 3500);
    } catch (err) {
      setActionError(err.message || 'Failed to assign crew.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordVerification = async () => {
    const notes = verificationNotes.trim() || 'Arrived on scene, cordoned off danger area, utility isolation confirmed.';
    soundFx.playClick();
    setActionLoading(true);
    setActionError('');
    try {
      await api.recordVerification(activeIncident.id, notes);
      soundFx.playSuccess();
      setActionSuccess('On-site verification and hazard assessment logged.');
      setShowVerifyForm(false);
      setVerificationNotes('');
      const fresh = await api.getIncidentById(activeIncident.id);
      if (fresh && fresh.data) setActiveIncident(fresh.data);
      if (onRefresh) onRefresh();
      setTimeout(() => setActionSuccess(''), 3500);
    } catch (err) {
      setActionError(err.message || 'Failed to record on-site verification.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordResolution = async () => {
    const notes = resolutionNotes.trim() || 'Repairs completed, perimeter safety verified, service restored.';
    soundFx.playClick();
    setActionLoading(true);
    setActionError('');
    try {
      await api.recordResolution(activeIncident.id, {
        notes,
        photo_url: resolutionPhoto
      });
      soundFx.playSuccess();
      setActionSuccess('Hazard marked as Resolved. Incident closed.');
      setShowResolveForm(false);
      setResolutionNotes('');
      setResolutionPhoto('');
      const fresh = await api.getIncidentById(activeIncident.id);
      if (fresh && fresh.data) setActiveIncident(fresh.data);
      if (onRefresh) onRefresh();
      setTimeout(() => setActionSuccess(''), 3500);
    } catch (err) {
      setActionError(err.message || 'Failed to record resolution.');
    } finally {
      setActionLoading(false);
    }
  };

  // Determine current step index in lifecycle
  const currentStepIndex = STATUS_STEPS.indexOf(activeIncident.status);
  const isRejected = activeIncident.status === 'Rejected';
  const isDispatcher = userRole === 'dispatcher' || authUser?.role === 'dispatcher' || authUser?.role === 'admin';
  const isCrew = userRole === 'field_crew' || authUser?.role === 'field_crew';

  const lat = parseFloat(activeIncident.latitude) || 37.7749;
  const lng = parseFloat(activeIncident.longitude) || -122.4194;
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
                <span className="font-mono text-xs font-bold text-[#183B56] bg-[#F7F8FA] px-2.5 py-0.5 rounded-md border border-[#E4E9EF]">
                  {activeIncident.reference_id}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getUrgencyStyle(activeIncident.urgency)}`}>
                  {activeIncident.urgency} Urgency
                </span>
                {activeIncident.is_demo && (
                  <span className="text-[10px] uppercase font-semibold bg-[#F7F8FA] text-[#697586] px-2 py-0.5 rounded-full border border-[#E4E9EF]">
                    Demo Record
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-[#183B56] mt-1 line-clamp-1">
                {activeIncident.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyId}
              className="p-2 text-[#183B56] hover:text-[#20A39E] bg-[#F7F8FA] hover:bg-[#EEF2F6] rounded-lg transition-colors border border-[#E4E9EF] shadow-2xs"
              title="Copy Reference ID"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="p-2 text-[#697586] hover:text-[#183B56] rounded-lg hover:bg-[#F7F8FA] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-5">

          {/* ============================================================== */}
          {/* INCIDENT PROGRESS LIFECYCLE TIMELINE */}
          {/* ============================================================== */}
          <div className="p-4 bg-[#F7F8FA] border border-[#E4E9EF] rounded-xl shadow-2xs">
            <h4 className="text-xs font-bold text-[#183B56] uppercase tracking-wider mb-3 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Truck className="w-4 h-4 text-[#20A39E]" />
                <span>Dispatch Pipeline Lifecycle</span>
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getStatusStyle(incident.status)}`}>
                Current Status: {incident.status}
              </span>
            </h4>

            {isRejected ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>This incident was reviewed and rejected as out-of-jurisdiction or not an infrastructure hazard.</span>
              </div>
            ) : (
              <div className="relative pt-2 pb-1">
                {/* Connecting track line */}
                <div className="hidden sm:block absolute top-6 left-6 right-6 h-0.5 bg-[#E4E9EF] -z-0">
                  <div 
                    className="h-full bg-[#20A39E] transition-all duration-500"
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
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors shadow-2xs ${
                          isCurrent
                            ? 'bg-[#20A39E] text-white ring-4 ring-[#20A39E]/20 font-bold'
                            : isDone
                            ? 'bg-[#EAF5EF] text-[#25855A] border border-[#C5E5D3]'
                            : 'bg-white border border-[#E4E9EF] text-[#697586]'
                        }`}>
                          {isDone ? <Check className="w-4 h-4" /> : idx + 1}
                        </div>
                        <div className="mt-1.5">
                          <p className={`text-[11px] font-semibold ${isCurrent ? 'text-[#20A39E]' : isDone ? 'text-[#183B56]' : 'text-[#697586]'}`}>
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
          <div className="p-4 bg-[#F7F8FA] border border-[#E4E9EF] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center space-x-3 text-left">
              <div className="p-2.5 bg-[#E6F7F6] text-[#20A39E] rounded-xl border border-[#B2EBE8]">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#183B56] block">
                  Community Hazard Verification
                </span>
                <span className="text-[11px] text-[#697586]">
                  {verifyCount} local citizens have confirmed this public danger.
                </span>
              </div>
            </div>

            <button
              onClick={handleVerify}
              disabled={hasVerified}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 shadow-2xs ${
                hasVerified
                  ? 'bg-[#EAF5EF] border border-[#C5E5D3] text-[#25855A] cursor-default font-bold'
                  : 'bg-[#20A39E] hover:bg-[#188B87] text-white shadow-xs'
              }`}
            >
              {hasVerified ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#25855A]" />
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
                <h4 className="text-xs font-bold text-[#697586] uppercase tracking-wider mb-1.5">
                  Official Hazard Description
                </h4>
                <p className="text-xs text-[#172B3A] leading-relaxed bg-[#F7F8FA] p-3.5 rounded-xl border border-[#E4E9EF] shadow-2xs">
                  {incident.description}
                </p>
              </div>

              {/* On-Site Verification Notes */}
              {incident.verification_notes && (
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1 shadow-2xs">
                  <span className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                    <span>Field Crew Triage Assessment</span>
                  </span>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    {incident.verification_notes}
                  </p>
                </div>
              )}

              {/* Resolution Notes */}
              {incident.resolution_notes && (
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1 shadow-2xs">
                  <span className="text-xs font-bold text-emerald-900 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Resolution & Restoration Details</span>
                  </span>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    {incident.resolution_notes}
                  </p>
                  {incident.resolved_at && (
                    <p className="text-[11px] text-emerald-700 pt-1 font-semibold">
                      Completed at: {new Date(incident.resolved_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Photo Evidence (Citizen or Completion) */}
              {(incident.photo_url || incident.resolution_photo_url) && (
                <div>
                  <h4 className="text-xs font-bold text-[#697586] uppercase tracking-wider mb-2">
                    Visual Evidence Records
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {incident.photo_url && (
                      <div className="space-y-1">
                        <span className="text-[11px] text-[#697586] font-medium">Citizen Initial Report:</span>
                        <div className="h-36 rounded-xl overflow-hidden border border-[#E4E9EF] group relative shadow-xs">
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
                        <span className="text-[11px] text-[#25855A] font-semibold">Field Crew Completion Proof:</span>
                        <div className="h-36 rounded-xl overflow-hidden border border-[#C5E5D3] group relative shadow-xs">
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
              <div className="p-3.5 bg-[#F7F8FA] rounded-xl border border-[#E4E9EF] space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#183B56] flex items-center space-x-1.5">
                    <Radio className="w-3.5 h-3.5 text-[#20A39E]" />
                    <span>Dispatch Incident Telemetry Log</span>
                  </span>
                  <button
                    onClick={() => setShowRadioChatter(!showRadioChatter)}
                    className="text-[11px] text-[#20A39E] hover:text-[#188B87] font-semibold"
                  >
                    {showRadioChatter ? 'Collapse' : 'Expand'}
                  </button>
                </div>

                {showRadioChatter && (
                  <div className="space-y-1.5 font-mono text-[11px] text-[#172B3A] bg-white p-3 rounded-lg border border-[#E4E9EF] shadow-2xs">
                    <p><span className="text-[#20A39E] font-semibold">[13:05] Central Dispatch:</span> Incident {incident.reference_id} logged. Urgency: {incident.urgency}.</p>
                    <p><span className="text-amber-700 font-semibold">[13:12] Municipal Rapid Unit:</span> Acknowledged site at {incident.landmark}. Unit en route.</p>
                    {incident.status === 'Resolved' && (
                      <p><span className="text-[#25855A] font-semibold">[13:45] Site Supervisor:</span> Repairs finalized. Infrastructure hazard cleared.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Citizen Community Field Notes */}
              <div className="space-y-2 pt-1">
                <h4 className="text-xs font-bold text-[#697586] uppercase tracking-wider flex items-center space-x-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#20A39E]" />
                  <span>Citizen Live Updates & Field Notes</span>
                </h4>

                <form onSubmit={handleAddCitizenNote} className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Add an on-the-ground observation (e.g. repair truck just pulled up)..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-[#E4E9EF] rounded-lg text-xs text-[#172B3A] placeholder-[#9AA4B2] focus:border-[#20A39E] focus:outline-hidden shadow-2xs"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-[#20A39E] hover:bg-[#188B87] text-white font-semibold rounded-lg text-xs flex items-center space-x-1 shadow-xs transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post</span>
                  </button>
                </form>

                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {citizenNotes.map((note) => (
                    <div key={note.id} className="p-2.5 bg-white rounded-lg border border-[#E4E9EF] text-xs flex items-start justify-between shadow-2xs">
                      <div>
                        <span className="font-semibold text-[#183B56] text-[11px] block">{note.author}</span>
                        <p className="text-[#697586] mt-0.5">{note.text}</p>
                      </div>
                      <span className="text-[10px] text-[#9AA4B2] shrink-0 font-medium">{note.time}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Sidebar Metadata & Live Mini Radar Map (1 Col) */}
            <div className="space-y-3">
              
              {/* Interactive Mini Radar Map */}
              <div className="bg-white rounded-xl border border-[#E4E9EF] overflow-hidden shadow-2xs">
                <div className="p-3 bg-[#F7F8FA] border-b border-[#E4E9EF] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#183B56] flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#20A39E]" />
                    <span>Geospatial Radar Pin</span>
                  </span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-[#20A39E] hover:text-[#188B87] font-semibold flex items-center space-x-1"
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
                    style={{ background: '#e5e7eb' }}
                  >
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                      attribution="&copy; OpenStreetMap contributors &copy; CARTO"
                    />
                    <Marker position={mapPos} icon={markerPin} />
                  </MapContainer>
                </div>
              </div>

              {/* Registry Details Box */}
              <div className="p-4 bg-[#F7F8FA] rounded-xl border border-[#E4E9EF] space-y-3 text-xs shadow-2xs">
                <h4 className="font-bold text-[#183B56] uppercase tracking-wider text-[11px] border-b border-[#E4E9EF] pb-2">
                  Registry Telemetry
                </h4>

                <div>
                  <span className="text-[#697586] block text-[11px] font-medium">Category</span>
                  <div className="flex items-center space-x-1.5 mt-0.5 font-semibold text-[#183B56]">
                    <CategoryIcon className="w-3.5 h-3.5 text-[#20A39E]" />
                    <span>{incident.category}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[#697586] block text-[11px] font-medium">Landmark & Sector</span>
                  <div className="flex items-start space-x-1.5 mt-0.5 font-semibold text-[#172B3A]">
                    <MapPin className="w-3.5 h-3.5 text-[#697586] shrink-0 mt-0.5" />
                    <span>{incident.landmark}, {incident.area}</span>
                  </div>
                </div>

                {incident.latitude != null && incident.longitude != null && !isNaN(Number(incident.latitude)) && (
                  <div>
                    <span className="text-[#697586] block text-[11px] font-medium">GPS Coordinates</span>
                    <p className="font-mono text-[#20A39E] font-semibold text-[11px] mt-0.5">
                      {Number(incident.latitude).toFixed(5)}, {Number(incident.longitude).toFixed(5)}
                    </p>
                  </div>
                )}

                <div>
                  <span className="text-[#697586] block text-[11px] font-medium">Assigned Municipal Crew</span>
                  <p className="font-semibold text-[#183B56] mt-0.5">
                    {incident.assigned_crew_name || '⚡ Rapid Utility Unit Delta-4'}
                  </p>
                </div>

                <div>
                  <span className="text-[#697586] block text-[11px] font-medium">Submission Time</span>
                  <p className="text-[#172B3A] mt-0.5 font-medium">
                    {new Date(incident.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

            </div>

          </div>

          {/* ============================================================== */}
          {/* AUDIT LOG & STATUS TIMELINE HISTORY */}
          {/* ============================================================== */}
          <div className="border-t border-[#E4E9EF] pt-4">
            <h4 className="text-xs font-bold text-[#183B56] uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-[#20A39E]" />
              <span>Official Action Log & Status History</span>
            </h4>

            <div className="space-y-2">
              {incident.logs && incident.logs.length > 0 ? (
                incident.logs.map((log, idx) => (
                  <div 
                    key={log.id || idx}
                    className="p-3.5 bg-[#F7F8FA] rounded-xl border border-[#E4E9EF] flex items-start justify-between text-xs shadow-2xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-[#183B56]">{log.actor_name}</span>
                        <span className="text-[#9AA4B2] text-[11px]">→</span>
                        <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] border ${getStatusStyle(log.new_status)}`}>
                          {log.new_status}
                        </span>
                      </div>
                      <p className="text-[#697586] leading-snug">{log.notes}</p>
                    </div>
                    <span className="text-[11px] text-[#9AA4B2] whitespace-nowrap pl-3 font-medium">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#697586] italic p-3.5 bg-[#F7F8FA] rounded-xl border border-[#E4E9EF]">
                  Initial citizen submission logged. No additional dispatch logs recorded yet.
                </p>
              )}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-white border-t border-[#E4E9EF] flex items-center justify-between">
          <div className="text-xs text-[#697586] font-mono font-bold">
            REF: {incident.reference_id}
          </div>
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="px-5 py-2.5 bg-white hover:bg-[#F7F8FA] text-[#183B56] font-semibold rounded-lg text-xs border border-[#E4E9EF] shadow-2xs transition-colors"
          >
            Close Details
          </button>
        </div>

      </div>
    </div>
  );
}
