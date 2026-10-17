import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  UserCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Search, 
  UserPlus, 
  ShieldAlert, 
  Loader2, 
  FileText, 
  ChevronRight, 
  ChevronDown, 
  Check, 
  MapPin, 
  Image as ImageIcon 
} from 'lucide-react';
import { api } from '../services/api.js';
import { getStatusStyle, getUrgencyStyle, formatTimeAgo, getCategoryIcon } from './IncidentCard.jsx';
import { soundFx } from '../services/soundFx.js';

export default function StaffPortal({ 
  userRole, 
  setUserRole, 
  onSelectIncident, 
  refreshTrigger, 
  onIncidentUpdated 
}) {
  const [incidents, setIncidents] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterUrgency, setFilterUrgency] = useState('');
  const [search, setSearch] = useState('');
  const [expandedIncidentId, setExpandedIncidentId] = useState(null);

  // Active action modals
  const [assignModalIncident, setAssignModalIncident] = useState(null);
  const [selectedCrewId, setSelectedCrewId] = useState('');
  const [verificationModalIncident, setVerificationModalIncident] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [resolutionModalIncident, setResolutionModalIncident] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionPhoto, setResolutionPhoto] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  // Load incidents & staff
  const loadData = async () => {
    setLoading(true);
    try {
      const [incRes, staffRes] = await Promise.all([
        api.getIncidents({ 
          status: filterStatus, 
          urgency: filterUrgency, 
          search,
          limit: 50 
        }),
        api.getStaffDirectory()
      ]);
      setIncidents(incRes.data || []);
      setStaffList(staffRes.data || []);
    } catch (err) {
      console.error('Error loading staff portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Live background polling for new incoming hazard reports
    const pollInterval = setInterval(async () => {
      try {
        const incRes = await api.getIncidents({ 
          status: filterStatus, 
          urgency: filterUrgency, 
          search,
          limit: 50 
        });
        if (incRes && incRes.data) {
          setIncidents(incRes.data);
        }
      } catch (err) {
        // Silently catch background poll failures
      }
    }, 4000);

    return () => clearInterval(pollInterval);
  }, [filterStatus, filterUrgency, search, refreshTrigger, userRole]);

  // Handle Dispatcher: Acknowledge Incident
  const handleAcknowledge = async (incident) => {
    soundFx.playClick();
    setActionLoading(true);
    try {
      await api.updateStatus(incident.id, 'Acknowledged', 'Incident reviewed by Dispatch triage officer.');
      soundFx.playSuccess();
      setActionSuccess(`Incident ${incident.reference_id} marked as Acknowledged.`);
      loadData();
      if (onIncidentUpdated) onIncidentUpdated();
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Dispatcher: Assign Field Crew
  const handleConfirmAssignment = async () => {
    if (!selectedCrewId) {
      alert('Please select a field crew member from the directory.');
      return;
    }
    setActionLoading(true);
    try {
      await api.assignCrew(assignModalIncident.id, selectedCrewId);
      soundFx.playSuccess();
      setActionSuccess(`Crew assigned to incident ${assignModalIncident.reference_id}.`);
      setAssignModalIncident(null);
      setSelectedCrewId('');
      loadData();
      if (onIncidentUpdated) onIncidentUpdated();
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Field Crew: Record On-Site Verification
  const handleConfirmVerification = async () => {
    if (!verificationNotes.trim() || verificationNotes.trim().length < 3) {
      alert('Please provide verification findings and perimeter status.');
      return;
    }
    setActionLoading(true);
    try {
      await api.recordVerification(verificationModalIncident.id, verificationNotes);
      soundFx.playSuccess();
      setActionSuccess(`On-site verification logged for ${verificationModalIncident.reference_id}.`);
      setVerificationModalIncident(null);
      setVerificationNotes('');
      loadData();
      if (onIncidentUpdated) onIncidentUpdated();
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Field Crew: Record Resolution
  const handleConfirmResolution = async () => {
    if (!resolutionNotes.trim() || resolutionNotes.trim().length < 5) {
      alert('Please describe the repairs completed and testing performed.');
      return;
    }
    setActionLoading(true);
    try {
      await api.recordResolution(resolutionModalIncident.id, {
        notes: resolutionNotes,
        photo_url: resolutionPhoto
      });
      soundFx.playSuccess();
      setActionSuccess(`Incident ${resolutionModalIncident.reference_id} marked as Resolved.`);
      setResolutionModalIncident(null);
      setResolutionNotes('');
      setResolutionPhoto('');
      loadData();
      if (onIncidentUpdated) onIncidentUpdated();
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleExpand = (id) => {
    soundFx.playClick();
    setExpandedIncidentId(prev => prev === id ? null : id);
  };

  const isFieldCrew = userRole === 'field_crew';
  const displayedIncidents = incidents;

  return (
    <div className="space-y-4">
      
      {/* Portal Top Institutional Header */}
      <div className="bg-[#111726] rounded-lg border border-[#1e293b] p-5 text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-sky-950 text-sky-300 border border-sky-800">
                {isFieldCrew ? 'Field Response Terminal' : 'Municipal Central Dispatch'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Active ID: {isFieldCrew ? 'Unit Echo-4 (Alex Rivera)' : 'Dispatcher DSP-104 (Officer Davis)'}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
              {isFieldCrew ? 'Field Crew Response Workstation' : 'Municipal Dispatch & Triage Console'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
              {isFieldCrew
                ? 'Review assigned hazard incidents, verify conditions on-site, cordon off danger zones, and file certified resolution evidence.'
                : 'Prioritize incoming citizen reports, acknowledge emergency status, and dispatch certified municipal utility repair teams.'}
            </p>
          </div>

          {/* Toggle Role Directly inside Portal */}
          <div className="flex items-center bg-[#0d131f] p-1 rounded-md border border-[#1e293b] shrink-0">
            <button
              onClick={() => {
                soundFx.playClick();
                setUserRole('dispatcher');
                localStorage.setItem('civicshield_staff_role', 'dispatcher');
              }}
              className={`px-3 py-1.5 rounded text-xs font-medium flex items-center space-x-1.5 transition-colors ${
                userRole === 'dispatcher'
                  ? 'bg-sky-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Dispatcher Console</span>
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                setUserRole('field_crew');
                localStorage.setItem('civicshield_staff_role', 'field_crew');
              }}
              className={`px-3 py-1.5 rounded text-xs font-medium flex items-center space-x-1.5 transition-colors ${
                userRole === 'field_crew'
                  ? 'bg-sky-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Field Crew Mobile</span>
            </button>
          </div>
        </div>

        {actionSuccess && (
          <div className="mt-3 p-2.5 bg-emerald-950/80 border border-emerald-800 rounded-md text-xs text-emerald-200 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-[#111726] p-3 rounded-lg border border-[#1e293b] flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex-1 w-full relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Reference ID, title, landmark, or sector..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#0d131f] border border-[#1e293b] rounded-md text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-[#0d131f] border border-[#1e293b] rounded-md text-xs text-slate-200 focus:outline-hidden focus:border-sky-500"
          >
            <option value="">All Statuses</option>
            <option value="Submitted">Submitted (Needs Triage)</option>
            <option value="Acknowledged">Acknowledged</option>
            <option value="Dispatched">Dispatched to Crew</option>
            <option value="On Site">On Site Working</option>
            <option value="Resolved">Resolved</option>
          </select>

          <select
            value={filterUrgency}
            onChange={(e) => setFilterUrgency(e.target.value)}
            className="px-2.5 py-1.5 bg-[#0d131f] border border-[#1e293b] rounded-md text-xs text-slate-200 focus:outline-hidden focus:border-sky-500"
          >
            <option value="">All Urgencies</option>
            <option value="Critical">Critical Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Incident Dispatch Queue Container */}
      <div className="bg-[#111726] rounded-lg border border-[#1e293b] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#1e293b] flex items-center justify-between bg-[#0d131f]">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-xs text-slate-200 uppercase tracking-wider">
              {isFieldCrew ? 'Field Assignment Queue' : 'Active Dispatch Triage Queue'}
            </h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#182338] text-sky-300 border border-[#263753]">
              {displayedIncidents.length} tickets
            </span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Real-time Sync Active</span>
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
            <span className="text-xs">Fetching records from Supabase...</span>
          </div>
        ) : displayedIncidents.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-xs">
            No active incidents matching the filter criteria.
          </div>
        ) : (
          <div className="divide-y divide-[#1e293b]">
            {displayedIncidents.map((incident) => {
              const CategoryIcon = getCategoryIcon(incident.category);
              const isExpanded = expandedIncidentId === incident.id;

              return (
                <div 
                  key={incident.id}
                  className="p-4 hover:bg-[#141b29] transition-colors"
                >
                  {/* Top Bar of the Item */}
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                    
                    {/* Left: Metadata & Header */}
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-semibold text-slate-300 bg-[#162032] border border-[#22314a] px-2 py-0.5 rounded">
                          {incident.reference_id}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${getStatusStyle(incident.status)}`}>
                          {incident.status}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded ${getUrgencyStyle(incident.urgency)}`}>
                          {incident.urgency}
                        </span>
                        <span className="text-xs text-slate-500">
                          • {formatTimeAgo(incident.created_at)}
                        </span>
                      </div>

                      <h4 className="font-semibold text-sm text-slate-100">
                        {incident.title}
                      </h4>

                      <div className="flex items-center space-x-3 text-xs text-slate-400">
                        <div className="flex items-center space-x-1">
                          <CategoryIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{incident.category}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          <span>{incident.landmark} ({incident.area})</span>
                        </div>
                        {incident.assigned_crew_name && (
                          <div className="flex items-center space-x-1 text-sky-400">
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Assigned: {incident.assigned_crew_name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Operational Action Buttons */}
                    <div className="flex items-center flex-wrap gap-1.5">
                      
                      {/* Toggle Details */}
                      <button
                        onClick={() => toggleExpand(incident.id)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-300 bg-[#162032] hover:bg-[#1d2b42] border border-[#22314a] rounded-md transition-colors flex items-center space-x-1"
                      >
                        <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      </button>

                      {/* Modal Details Trigger */}
                      <button
                        onClick={() => {
                          soundFx.playClick();
                          onSelectIncident(incident);
                        }}
                        className="px-2.5 py-1 text-xs font-medium text-slate-300 bg-[#162032] hover:bg-[#1d2b42] border border-[#22314a] rounded-md transition-colors flex items-center space-x-1"
                        title="Open full audit modal"
                      >
                        <FileText className="w-3 h-3 text-slate-400" />
                        <span>Timeline</span>
                      </button>

                      {/* DISPATCHER ACTIONS */}
                      {!isFieldCrew && (
                        <>
                          {incident.status === 'Submitted' && (
                            <button
                              disabled={actionLoading}
                              onClick={() => handleAcknowledge(incident)}
                              className="px-2.5 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors flex items-center space-x-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>Acknowledge</span>
                            </button>
                          )}

                          {incident.status !== 'Resolved' && incident.status !== 'Rejected' && (
                            <button
                              onClick={() => {
                                soundFx.playClick();
                                setAssignModalIncident(incident);
                              }}
                              className="px-2.5 py-1 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-md transition-colors flex items-center space-x-1"
                            >
                              <UserPlus className="w-3 h-3" />
                              <span>{incident.assigned_crew_id ? 'Reassign' : 'Dispatch'}</span>
                            </button>
                          )}
                        </>
                      )}

                      {/* FIELD CREW ACTIONS */}
                      {isFieldCrew && (
                        <>
                          {incident.status === 'Dispatched' && (
                            <button
                              onClick={() => {
                                soundFx.playClick();
                                setVerificationModalIncident(incident);
                              }}
                              className="px-2.5 py-1 text-xs font-medium text-white bg-amber-600 hover:bg-amber-500 rounded-md transition-colors flex items-center space-x-1"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Mark On-Site</span>
                            </button>
                          )}

                          {(incident.status === 'Dispatched' || incident.status === 'On Site') && (
                            <button
                              onClick={() => {
                                soundFx.playClick();
                                setResolutionModalIncident(incident);
                              }}
                              className="px-2.5 py-1 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-md transition-colors flex items-center space-x-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Mark Resolved</span>
                            </button>
                          )}
                        </>
                      )}

                    </div>
                  </div>

                  {/* Expandable Details Drawer */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-[#1e293b] bg-[#0d131f] p-3.5 rounded-md space-y-3 text-xs">
                      
                      <div>
                        <span className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider block mb-1">
                          Full Hazard Description:
                        </span>
                        <p className="text-slate-300 bg-[#111726] p-2.5 rounded border border-[#1e293b] leading-relaxed">
                          {incident.description}
                        </p>
                      </div>

                      {incident.verification_notes && (
                        <div className="p-2.5 bg-amber-950/40 border border-amber-800 rounded text-amber-200 space-y-1">
                          <span className="font-semibold flex items-center space-x-1.5 text-amber-300">
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>On-Site Verification Findings:</span>
                          </span>
                          <p>{incident.verification_notes}</p>
                        </div>
                      )}

                      {incident.resolution_notes && (
                        <div className="p-2.5 bg-emerald-950/40 border border-emerald-800 rounded text-emerald-200 space-y-1">
                          <span className="font-semibold flex items-center space-x-1.5 text-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Resolution & Completed Repairs:</span>
                          </span>
                          <p>{incident.resolution_notes}</p>
                          {incident.resolved_at && (
                            <p className="text-[10px] text-emerald-400 mt-1">Resolved at: {new Date(incident.resolved_at).toLocaleString()}</p>
                          )}
                        </div>
                      )}

                      {/* Photo preview */}
                      {(incident.photo_url || incident.resolution_photo_url) && (
                        <div className="pt-1">
                          <span className="font-semibold text-slate-400 block mb-1">Evidence Records:</span>
                          <div className="flex gap-2">
                            {incident.photo_url && (
                              <div className="h-24 w-24 rounded overflow-hidden border border-[#1e293b]">
                                <img src={incident.photo_url} alt="Report Photo" className="w-full h-full object-cover" />
                              </div>
                            )}
                            {incident.resolution_photo_url && (
                              <div className="h-24 w-24 rounded overflow-hidden border border-emerald-800">
                                <img src={incident.resolution_photo_url} alt="Resolution Photo" className="w-full h-full object-cover" />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: ASSIGN FIELD CREW (DISPATCHER) */}
      {assignModalIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-[#111726] rounded-lg p-5 max-w-md w-full border border-[#1e293b] space-y-4 text-white shadow-xl">
            <h3 className="font-semibold text-sm text-white">
              Dispatch Field Crew Unit
            </h3>
            <p className="text-xs text-slate-400">
              Assign a certified repair team to incident <strong className="font-mono text-slate-200">{assignModalIncident.reference_id}</strong> ({assignModalIncident.category}).
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Select Qualified Response Team
              </label>
              <select
                value={selectedCrewId}
                onChange={(e) => setSelectedCrewId(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-[#1e293b] bg-[#0d131f] text-xs text-slate-200 focus:outline-hidden focus:border-sky-500"
              >
                <option value="">-- Choose Field Crew --</option>
                {staffList.filter(s => s.role === 'field_crew').map(crew => (
                  <option key={crew.id} value={crew.id}>
                    {crew.full_name} ({crew.badge_number}) — {crew.department}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#1e293b]">
              <button
                type="button"
                onClick={() => setAssignModalIncident(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-[#0d131f] border border-[#1e293b] rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading || !selectedCrewId}
                onClick={handleConfirmAssignment}
                className="px-4 py-1.5 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-md disabled:opacity-50"
              >
                {actionLoading ? 'Dispatching...' : 'Deploy Unit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ON-SITE VERIFICATION (FIELD CREW) */}
      {verificationModalIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-[#111726] rounded-lg p-5 max-w-md w-full border border-[#1e293b] space-y-4 text-white shadow-xl">
            <h3 className="font-semibold text-sm text-white flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>Record On-Site Arrival & Verification</span>
            </h3>
            <p className="text-xs text-slate-400">
              Confirm arrival at <strong className="text-slate-200">{verificationModalIncident.landmark}</strong> and log perimeter assessment.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Field Triage Findings <span className="text-red-400">*</span>
              </label>
              <textarea
                rows="3"
                placeholder="e.g. Arrived on site. Cordoned perimeter with safety cones. Feeder breaker isolated. Beginning repairs."
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-[#1e293b] bg-[#0d131f] text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#1e293b]">
              <button
                type="button"
                onClick={() => setVerificationModalIncident(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-[#0d131f] border border-[#1e293b] rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmVerification}
                className="px-4 py-1.5 text-xs font-medium text-white bg-amber-600 hover:bg-amber-500 rounded-md"
              >
                {actionLoading ? 'Logging...' : 'Confirm Arrival'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: RESOLUTION & COMPLETION (FIELD CREW) */}
      {resolutionModalIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-[#111726] rounded-lg p-5 max-w-md w-full border border-[#1e293b] space-y-4 text-white shadow-xl">
            <h3 className="font-semibold text-sm text-white flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Record Incident Resolution</span>
            </h3>
            <p className="text-xs text-slate-400">
              Document completed repairs and restore public utility status for incident <strong className="font-mono text-slate-200">{resolutionModalIncident.reference_id}</strong>.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Resolution Notes <span className="text-red-400">*</span>
              </label>
              <textarea
                rows="3"
                placeholder="e.g. Spliced 440V overhead cable, reattached insulator bracket, and tested phase voltage. Roadway cleared and safe for public access."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-[#1e293b] bg-[#0d131f] text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Completion Photo URL (Optional)
              </label>
              <input
                type="text"
                placeholder="https://... (or demo image link)"
                value={resolutionPhoto}
                onChange={(e) => setResolutionPhoto(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-[#1e293b] bg-[#0d131f] text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#1e293b]">
              <button
                type="button"
                onClick={() => setResolutionModalIncident(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-[#0d131f] border border-[#1e293b] rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmResolution}
                className="px-4 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-md"
              >
                {actionLoading ? 'Saving...' : 'Mark Resolved'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
