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
  Image as ImageIcon,
  LogOut,
  Lock,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api.js';
import { getStatusStyle, getUrgencyStyle, formatTimeAgo, getCategoryIcon } from './IncidentCard.jsx';
import { soundFx } from '../services/soundFx.js';

export default function StaffPortal({ 
  userRole, 
  setUserRole, 
  onSelectIncident, 
  refreshTrigger, 
  onIncidentUpdated,
  authUser,
  onLogout
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
  const isAdmin = authUser?.role === 'admin';
  const activeOfficerName = authUser?.name || (isFieldCrew ? 'Alex Rivera (Rapid Crew #4)' : 'Officer Davis');
  const activeBadge = authUser?.badge_number || (isFieldCrew ? 'FC-402' : 'DSP-104');
  const activeDept = authUser?.department || (isFieldCrew ? 'Electrical & Utility Infrastructure' : 'Central Emergency Dispatch');

  const displayedIncidents = incidents;

  return (
    <div className="space-y-5">
      
      {/* Portal Top Institutional Header */}
      <div className="bg-white rounded-2xl border border-[#E4E9EF] p-6 text-[#172B3A] shadow-card">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                isFieldCrew 
                  ? 'bg-amber-50 text-amber-800 border-amber-200' 
                  : 'bg-[#E6F7F6] text-[#188B87] border-[#B2EBE8]'
              }`}>
                {isFieldCrew ? 'Field Response Terminal' : 'Municipal Central Dispatch'}
              </span>
              <span className="text-xs text-[#697586] font-mono flex items-center space-x-1.5">
                <span className="text-[#9AA4B2]">Badge:</span>
                <span className="text-[#183B56] font-bold">{activeBadge}</span>
                <span className="text-[#CBD5E1]">•</span>
                <span className="text-[#183B56] font-medium">{activeOfficerName}</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#183B56] mt-1.5 flex items-center space-x-2.5">
              <span>{isFieldCrew ? 'Field Crew Response Workstation' : 'Municipal Dispatch & Triage Console'}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#EAF5EF] border border-[#C5E5D3] text-[#25855A] font-semibold">
                Terminal Active
              </span>
            </h2>
            <p className="text-xs text-[#697586] mt-1 max-w-2xl leading-relaxed">
              {isFieldCrew
                ? `Active unit assigned to ${activeDept}. Review assigned hazard incidents, verify conditions on-site, cordon off danger zones, and submit photo resolution proof.`
                : `Operating under ${activeDept}. Prioritize incoming citizen reports, acknowledge emergency status, and dispatch certified municipal utility repair teams.`}
            </p>
          </div>

          {/* Right Header Controls: Admin toggle & Log Out */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* If Admin, allow toggling views for supervision */}
            {isAdmin && (
              <div className="flex items-center bg-[#F7F8FA] p-1 rounded-xl border border-[#E4E9EF] shadow-2xs">
                <button
                  onClick={() => {
                    soundFx.playClick();
                    setUserRole('dispatcher');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                    userRole === 'dispatcher'
                      ? 'bg-[#183B56] text-white shadow-2xs'
                      : 'text-[#697586] hover:text-[#183B56]'
                  }`}
                  title="Supervisor: View as Dispatcher"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Dispatch</span>
                </button>
                <button
                  onClick={() => {
                    soundFx.playClick();
                    setUserRole('field_crew');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                    userRole === 'field_crew'
                      ? 'bg-[#20A39E] text-white shadow-2xs'
                      : 'text-[#697586] hover:text-[#183B56]'
                  }`}
                  title="Supervisor: View as Field Crew"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Crew</span>
                </button>
              </div>
            )}

            {/* Log Out Terminal Button */}
            <button
              onClick={() => {
                soundFx.playClick();
                if (onLogout) onLogout();
              }}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs flex items-center space-x-1.5 transition-colors"
              title="Lock terminal and sign out"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span>Lock Terminal</span>
            </button>
          </div>
        </div>

        {actionSuccess && (
          <div className="mt-4 p-3 bg-[#EAF5EF] border border-[#C5E5D3] rounded-xl text-xs text-[#25855A] flex items-center space-x-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-[#25855A] shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-[#E4E9EF] shadow-card flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex-1 w-full relative">
          <Search className="w-3.5 h-3.5 text-[#697586] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Reference ID, title, landmark, or sector..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#F7F8FA] border border-[#E4E9EF] rounded-lg text-xs text-[#172B3A] placeholder-[#9AA4B2] focus:outline-hidden focus:border-[#20A39E] focus:bg-white transition-all shadow-2xs"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 bg-[#F7F8FA] border border-[#E4E9EF] rounded-lg text-xs text-[#172B3A] font-medium focus:outline-hidden focus:border-[#20A39E] focus:bg-white shadow-2xs cursor-pointer"
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
            className="px-3 py-1.5 bg-[#F7F8FA] border border-[#E4E9EF] rounded-lg text-xs text-[#172B3A] font-medium focus:outline-hidden focus:border-[#20A39E] focus:bg-white shadow-2xs cursor-pointer"
          >
            <option value="">All Urgencies</option>
            <option value="Critical">Critical Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Incident Dispatch Queue Container */}
      <div className="bg-white rounded-2xl border border-[#E4E9EF] overflow-hidden shadow-card">
        <div className="px-6 py-4 border-b border-[#E4E9EF] flex items-center justify-between bg-[#F7F8FA]">
          <div className="flex items-center space-x-2.5">
            <h3 className="font-bold text-xs text-[#183B56] uppercase tracking-wider">
              {isFieldCrew ? 'Field Assignment Queue' : 'Active Dispatch Triage Queue'}
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E6F7F6] text-[#188B87] border border-[#B2EBE8]">
              {displayedIncidents.length} tickets
            </span>
          </div>
          <span className="text-[11px] text-[#697586] hidden sm:flex items-center space-x-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Real-time Sync Active</span>
          </span>
        </div>

        {loading ? (
          <div className="p-16 text-center text-[#697586] flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#20A39E]" />
            <span className="text-xs font-semibold text-[#183B56]">Fetching records from municipal database...</span>
          </div>
        ) : displayedIncidents.length === 0 ? (
          <div className="p-12 text-center text-[#697586] text-xs font-medium">
            No active incidents matching the filter criteria.
          </div>
        ) : (
          <div className="divide-y divide-[#E4E9EF]">
            {displayedIncidents.map((incident) => {
              const CategoryIcon = getCategoryIcon(incident.category);
              const isExpanded = expandedIncidentId === incident.id;

              return (
                <div 
                  key={incident.id}
                  className="p-5 hover:bg-[#F7F8FA] transition-colors"
                >
                  {/* Top Bar of the Item */}
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                    
                    {/* Left: Metadata & Header */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-[#183B56] bg-white border border-[#E4E9EF] px-2.5 py-0.5 rounded-md shadow-2xs">
                          {incident.reference_id}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${getStatusStyle(incident.status)}`}>
                          {incident.status}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${getUrgencyStyle(incident.urgency)}`}>
                          {incident.urgency}
                        </span>
                        <span className="text-xs text-[#9AA4B2]">
                          • {formatTimeAgo(incident.created_at)}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-[#183B56]">
                        {incident.title}
                      </h4>

                      <div className="flex items-center flex-wrap gap-3 text-xs text-[#697586]">
                        <div className="flex items-center space-x-1.5">
                          <CategoryIcon className="w-3.5 h-3.5 text-[#697586]" />
                          <span className="font-medium text-[#172B3A]">{incident.category}</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#9AA4B2]" />
                          <span>{incident.landmark} ({incident.area})</span>
                        </div>
                        {incident.assigned_crew_name && (
                          <div className="flex items-center space-x-1.5 text-[#20A39E] font-semibold">
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Assigned: {incident.assigned_crew_name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Operational Action Buttons */}
                    <div className="flex items-center flex-wrap gap-2">
                      
                      {/* Toggle Details */}
                      <button
                        onClick={() => toggleExpand(incident.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-[#183B56] bg-white hover:bg-[#F7F8FA] border border-[#E4E9EF] rounded-lg shadow-2xs transition-colors flex items-center space-x-1"
                      >
                        <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                        {isExpanded ? <ChevronDown className="w-3 h-3 text-[#697586]" /> : <ChevronRight className="w-3 h-3 text-[#697586]" />}
                      </button>

                      {/* Modal Details Trigger */}
                      <button
                        onClick={() => {
                          soundFx.playClick();
                          onSelectIncident(incident);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-[#183B56] bg-white hover:bg-[#F7F8FA] border border-[#E4E9EF] rounded-lg shadow-2xs transition-colors flex items-center space-x-1.5"
                        title="Open full audit modal"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#20A39E]" />
                        <span>Timeline</span>
                      </button>

                      {/* DISPATCHER ACTIONS */}
                      {!isFieldCrew && (
                        <>
                          {incident.status === 'Submitted' && (
                            <button
                              disabled={actionLoading}
                              onClick={() => handleAcknowledge(incident)}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#183B56] hover:bg-[#122e44] rounded-lg shadow-xs transition-colors flex items-center space-x-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Acknowledge</span>
                            </button>
                          )}

                          {incident.status !== 'Resolved' && incident.status !== 'Rejected' && (
                            <button
                              onClick={() => {
                                soundFx.playClick();
                                setAssignModalIncident(incident);
                              }}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#20A39E] hover:bg-[#188B87] rounded-lg shadow-xs transition-colors flex items-center space-x-1.5"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
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
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors flex items-center space-x-1.5"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Mark On-Site</span>
                            </button>
                          )}

                          {(incident.status === 'Dispatched' || incident.status === 'On Site') && (
                            <button
                              onClick={() => {
                                soundFx.playClick();
                                setResolutionModalIncident(incident);
                              }}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#25855A] hover:bg-[#1d6b48] rounded-lg shadow-xs transition-colors flex items-center space-x-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Mark Resolved</span>
                            </button>
                          )}
                        </>
                      )}

                    </div>
                  </div>

                  {/* Expandable Details Drawer */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-[#E4E9EF] bg-[#F7F8FA] p-4 rounded-xl space-y-3 text-xs shadow-2xs">
                      
                      <div>
                        <span className="font-bold text-[#697586] text-[11px] uppercase tracking-wider block mb-1">
                          Full Hazard Description:
                        </span>
                        <p className="text-[#172B3A] bg-white p-3 rounded-lg border border-[#E4E9EF] leading-relaxed shadow-2xs">
                          {incident.description}
                        </p>
                      </div>

                      {incident.verification_notes && (
                        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-900 space-y-1">
                          <span className="font-bold flex items-center space-x-1.5 text-amber-800">
                            <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                            <span>On-Site Verification Findings:</span>
                          </span>
                          <p>{incident.verification_notes}</p>
                        </div>
                      )}

                      {incident.resolution_notes && (
                        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-emerald-900 space-y-1">
                          <span className="font-bold flex items-center space-x-1.5 text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Resolution & Completed Repairs:</span>
                          </span>
                          <p>{incident.resolution_notes}</p>
                          {incident.resolved_at && (
                            <p className="text-[10px] text-emerald-700 mt-1 font-semibold">Resolved at: {new Date(incident.resolved_at).toLocaleString()}</p>
                          )}
                        </div>
                      )}

                      {/* Photo preview */}
                      {(incident.photo_url || incident.resolution_photo_url) && (
                        <div className="pt-1">
                          <span className="font-bold text-[#697586] block mb-1.5">Evidence Records:</span>
                          <div className="flex gap-2.5">
                            {incident.photo_url && (
                              <div className="h-24 w-24 rounded-lg overflow-hidden border border-[#E4E9EF] shadow-2xs">
                                <img src={incident.photo_url} alt="Report Photo" className="w-full h-full object-cover" />
                              </div>
                            )}
                            {incident.resolution_photo_url && (
                              <div className="h-24 w-24 rounded-lg overflow-hidden border border-emerald-300 shadow-2xs">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-[#E4E9EF] space-y-4 text-[#172B3A] shadow-elevated">
            <h3 className="font-bold text-base text-[#183B56]">
              Dispatch Field Crew Unit
            </h3>
            <p className="text-xs text-[#697586]">
              Assign a certified repair team to incident <strong className="font-mono text-[#183B56]">{assignModalIncident.reference_id}</strong> ({assignModalIncident.category}).
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#183B56] mb-1.5">
                Select Qualified Response Team
              </label>
              <select
                value={selectedCrewId}
                onChange={(e) => setSelectedCrewId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E4E9EF] bg-white text-xs text-[#172B3A] font-medium focus:outline-hidden focus:border-[#20A39E] shadow-2xs"
              >
                <option value="">-- Choose Field Crew --</option>
                {staffList.filter(s => s.role === 'field_crew').map(crew => (
                  <option key={crew.id} value={crew.id}>
                    {crew.full_name} ({crew.badge_number}) — {crew.department}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E4E9EF]">
              <button
                type="button"
                onClick={() => setAssignModalIncident(null)}
                className="px-4 py-2 text-xs font-semibold text-[#697586] hover:text-[#183B56] bg-white border border-[#E4E9EF] rounded-lg shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading || !selectedCrewId}
                onClick={handleConfirmAssignment}
                className="px-5 py-2 text-xs font-semibold text-white bg-[#20A39E] hover:bg-[#188B87] rounded-lg shadow-xs disabled:opacity-50"
              >
                {actionLoading ? 'Dispatching...' : 'Deploy Unit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ON-SITE VERIFICATION (FIELD CREW) */}
      {verificationModalIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-[#E4E9EF] space-y-4 text-[#172B3A] shadow-elevated">
            <h3 className="font-bold text-base text-[#183B56] flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-amber-600" />
              <span>Record On-Site Arrival & Verification</span>
            </h3>
            <p className="text-xs text-[#697586]">
              Confirm arrival at <strong className="text-[#183B56]">{verificationModalIncident.landmark}</strong> and log perimeter assessment.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#183B56] mb-1.5">
                Field Triage Findings <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows="3"
                placeholder="e.g. Arrived on site. Cordoned perimeter with safety cones. Feeder breaker isolated. Beginning repairs."
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E4E9EF] bg-white text-xs text-[#172B3A] placeholder-[#9AA4B2] focus:outline-hidden focus:border-[#20A39E] shadow-2xs"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E4E9EF]">
              <button
                type="button"
                onClick={() => setVerificationModalIncident(null)}
                className="px-4 py-2 text-xs font-semibold text-[#697586] hover:text-[#183B56] bg-white border border-[#E4E9EF] rounded-lg shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmVerification}
                className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs"
              >
                {actionLoading ? 'Logging...' : 'Confirm Arrival'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: RESOLUTION & COMPLETION (FIELD CREW) */}
      {resolutionModalIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-[#E4E9EF] space-y-4 text-[#172B3A] shadow-elevated">
            <h3 className="font-bold text-base text-[#183B56] flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-[#25855A]" />
              <span>Record Incident Resolution</span>
            </h3>
            <p className="text-xs text-[#697586]">
              Document completed repairs and restore public utility status for incident <strong className="font-mono text-[#183B56]">{resolutionModalIncident.reference_id}</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#183B56] mb-1.5">
                Resolution Notes <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows="3"
                placeholder="e.g. Spliced 440V overhead cable, reattached insulator bracket, and tested phase voltage. Roadway cleared and safe for public access."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E4E9EF] bg-white text-xs text-[#172B3A] placeholder-[#9AA4B2] focus:outline-hidden focus:border-[#20A39E] shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#183B56] mb-1.5">
                Completion Photo URL (Optional)
              </label>
              <input
                type="text"
                placeholder="https://... (or demo image link)"
                value={resolutionPhoto}
                onChange={(e) => setResolutionPhoto(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E4E9EF] bg-white text-xs text-[#172B3A] placeholder-[#9AA4B2] focus:outline-hidden focus:border-[#20A39E] shadow-2xs"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E4E9EF]">
              <button
                type="button"
                onClick={() => setResolutionModalIncident(null)}
                className="px-4 py-2 text-xs font-semibold text-[#697586] hover:text-[#183B56] bg-white border border-[#E4E9EF] rounded-lg shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmResolution}
                className="px-5 py-2 text-xs font-semibold text-white bg-[#25855A] hover:bg-[#1d6b48] rounded-lg shadow-xs"
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
