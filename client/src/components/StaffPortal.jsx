import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  UserCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Filter, 
  Search, 
  UserPlus, 
  ShieldAlert, 
  ArrowRight, 
  Loader2, 
  FileText,
  Upload,
  ChevronRight,
  ExternalLink,
  Flame,
  Check
} from 'lucide-react';
import { api } from '../services/api.js';
import { getStatusStyle, getUrgencyStyle, formatTimeAgo, getCategoryIcon } from './IncidentCard.jsx';

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
  }, [filterStatus, filterUrgency, search, refreshTrigger, userRole]);

  // Handle Dispatcher: Acknowledge Incident
  const handleAcknowledge = async (incident) => {
    setActionLoading(true);
    try {
      await api.updateStatus(incident.id, 'Acknowledged', 'Incident reviewed by Dispatch triage officer.');
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

  // Crew filter for Field Crew role
  const isFieldCrew = userRole === 'field_crew';
  const displayedIncidents = isFieldCrew
    ? incidents.filter(i => i.status === 'Dispatched' || i.status === 'On Site' || i.assigned_crew_id)
    : incidents;

  return (
    <div className="space-y-6">
      
      {/* Portal Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-slate-700/80">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
                {isFieldCrew ? 'Field Response Unit' : 'Municipal Central Dispatch'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Operator: {isFieldCrew ? 'Alex Rivera (Crew #4)' : 'Officer Davis (DSP-104)'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold brand-font text-white mt-1">
              {isFieldCrew ? 'Field Crew Operations Terminal' : 'Authorized Dispatcher Control Console'}
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              {isFieldCrew
                ? 'Review assigned hazard incidents, log on-site verification, and record completion with resolution photos.'
                : 'Triage reported civic hazards, verify urgency, acknowledge dispatches, and mobilize rapid repair crews.'}
            </p>
          </div>

          {/* Toggle Role Directly inside Portal */}
          <div className="flex items-center bg-slate-800/90 p-1.5 rounded-2xl border border-slate-700 shrink-0">
            <button
              onClick={() => {
                setUserRole('dispatcher');
                localStorage.setItem('civicshield_staff_role', 'dispatcher');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                userRole === 'dispatcher'
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Dispatcher View</span>
            </button>
            <button
              onClick={() => {
                setUserRole('field_crew');
                localStorage.setItem('civicshield_staff_role', 'field_crew');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                userRole === 'field_crew'
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Field Crew View</span>
            </button>
          </div>
        </div>

        {actionSuccess && (
          <div className="mt-4 p-3 bg-teal-900/60 border border-teal-500/50 rounded-xl text-xs text-teal-200 flex items-center space-x-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by ID, keyword, landmark, or sector..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Statuses</option>
            <option value="Submitted">Submitted (Pending Triage)</option>
            <option value="Acknowledged">Acknowledged</option>
            <option value="Dispatched">Dispatched</option>
            <option value="On Site">On Site</option>
            <option value="Resolved">Resolved</option>
          </select>

          <select
            value={filterUrgency}
            onChange={(e) => setFilterUrgency(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Urgencies</option>
            <option value="Critical">Critical</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Incident Dispatch Queue Table / List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 brand-font">
            {isFieldCrew ? 'Active Field Assignments' : 'Hazard Dispatch Registry'} ({displayedIncidents.length})
          </h3>
          <span className="text-xs text-slate-400">
            Real-time status changes sync directly to citizen dashboard
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
            <span className="text-xs">Fetching municipal records...</span>
          </div>
        ) : displayedIncidents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No incidents found matching the active filter criteria.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {displayedIncidents.map((incident) => {
              const CategoryIcon = getCategoryIcon(incident.category);

              return (
                <div 
                  key={incident.id}
                  className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                >
                  {/* Left: Metadata */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {incident.reference_id}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusStyle(incident.status)}`}>
                        {incident.status}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getUrgencyStyle(incident.urgency)}`}>
                        {incident.urgency}
                      </span>
                      <span className="text-xs text-slate-400">
                        • {formatTimeAgo(incident.created_at)}
                      </span>
                    </div>

                    <h4 
                      onClick={() => onSelectIncident(incident)}
                      className="font-bold text-sm text-slate-900 hover:text-teal-700 cursor-pointer transition-colors"
                    >
                      {incident.title}
                    </h4>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <div className="flex items-center space-x-1">
                        <CategoryIcon className="w-3.5 h-3.5 text-teal-600" />
                        <span>{incident.category}</span>
                      </div>
                      <span>•</span>
                      <span>{incident.landmark}, {incident.area}</span>
                      {incident.assigned_crew_name && (
                        <>
                          <span>•</span>
                          <span className="font-medium text-slate-700">
                            Crew: {incident.assigned_crew_name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: Role-Based Dispatcher / Crew Action Buttons */}
                  <div className="flex items-center flex-wrap gap-2">
                    
                    {/* View Full Modal */}
                    <button
                      onClick={() => onSelectIncident(incident)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                      Audit Details
                    </button>

                    {/* DISPATCHER ACTIONS */}
                    {!isFieldCrew && (
                      <>
                        {incident.status === 'Submitted' && (
                          <button
                            disabled={actionLoading}
                            onClick={() => handleAcknowledge(incident)}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center space-x-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Acknowledge</span>
                          </button>
                        )}

                        {incident.status !== 'Resolved' && incident.status !== 'Rejected' && (
                          <button
                            onClick={() => setAssignModalIncident(incident)}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors flex items-center space-x-1"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>{incident.assigned_crew_id ? 'Reassign Crew' : 'Dispatch Crew'}</span>
                          </button>
                        )}
                      </>
                    )}

                    {/* FIELD CREW ACTIONS */}
                    {isFieldCrew && (
                      <>
                        {incident.status === 'Dispatched' && (
                          <button
                            onClick={() => setVerificationModalIncident(incident)}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors flex items-center space-x-1"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Mark On-Site</span>
                          </button>
                        )}

                        {(incident.status === 'Dispatched' || incident.status === 'On Site') && (
                          <button
                            onClick={() => setResolutionModalIncident(incident)}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors flex items-center space-x-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Resolved</span>
                          </button>
                        )}
                      </>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: ASSIGN FIELD CREW (DISPATCHER) */}
      {/* ============================================================== */}
      {assignModalIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-base text-slate-900 brand-font">
              Dispatch Field Crew Unit
            </h3>
            <p className="text-xs text-slate-600">
              Assign a certified repair crew to incident <span className="font-mono font-bold">{assignModalIncident.reference_id}</span> ({assignModalIncident.category}).
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Available Field Team
              </label>
              <select
                value={selectedCrewId}
                onChange={(e) => setSelectedCrewId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="">-- Choose Field Crew --</option>
                {staffList.filter(s => s.role === 'field_crew').map(crew => (
                  <option key={crew.id} value={crew.id}>
                    {crew.full_name} ({crew.badge_number}) — {crew.department}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setAssignModalIncident(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading || !selectedCrewId}
                onClick={handleConfirmAssignment}
                className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs disabled:opacity-50"
              >
                {actionLoading ? 'Dispatching...' : 'Deploy Crew Unit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: ON-SITE VERIFICATION (FIELD CREW) */}
      {/* ============================================================== */}
      {verificationModalIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-base text-slate-900 brand-font flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-amber-600" />
              <span>Record On-Site Arrival & Verification</span>
            </h3>
            <p className="text-xs text-slate-600">
              Confirm arrival at <span className="font-semibold">{verificationModalIncident.landmark}</span> and log technical field assessment.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Verification & Safety Notes <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows="3"
                placeholder="e.g. Arrived on site. Perimeter cordoned off with safety cones. Voltage meter confirmed active current. Isolating feeder breaker."
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setVerificationModalIncident(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmVerification}
                className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs"
              >
                {actionLoading ? 'Logging Arrival...' : 'Mark On-Site'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: RESOLUTION & COMPLETION (FIELD CREW) */}
      {/* ============================================================== */}
      {resolutionModalIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-base text-slate-900 brand-font flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-teal-600" />
              <span>Record Incident Resolution</span>
            </h3>
            <p className="text-xs text-slate-600">
              Document completed repairs and restore public utility status for incident <span className="font-mono font-bold">{resolutionModalIncident.reference_id}</span>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Resolution & Restoration Notes <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows="3"
                placeholder="e.g. Spliced 440V overhead cable, reattached insulator bracket, and verified phase voltage. Roadway cleared and safe for public access."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Completion Photo URL (Optional)
              </label>
              <input
                type="text"
                placeholder="https://... (or demo image link)"
                value={resolutionPhoto}
                onChange={(e) => setResolutionPhoto(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setResolutionModalIncident(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmResolution}
                className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs"
              >
                {actionLoading ? 'Saving...' : 'Mark Incident Resolved'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
