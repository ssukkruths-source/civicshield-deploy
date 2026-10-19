import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar.jsx';
import StatsCounter from './components/StatsCounter.jsx';
import IncidentCard, { getStatusStyle, getUrgencyStyle, formatTimeAgo, getCategoryIcon } from './components/IncidentCard.jsx';
import IncidentMap from './components/IncidentMap.jsx';
import ReportHazardModal from './components/ReportHazardModal.jsx';
import IncidentDetailsModal from './components/IncidentDetailsModal.jsx';
import TrackReferenceModal from './components/TrackReferenceModal.jsx';
import StaffPortal from './components/StaffPortal.jsx';
import StaffLogin from './components/StaffLogin.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import { api } from './services/api.js';
import { soundFx } from './services/soundFx.js';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Plus, 
  Map, 
  LayoutGrid, 
  List, 
  Loader2, 
  ShieldAlert, 
  RefreshCw, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Navigation,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  MapPin,
  Lock
} from 'lucide-react';

export default function App() {
  // Authentication & Staff User session
  const [authUser, setAuthUser] = useState(() => {
    try {
      const saved = localStorage.getItem('civicshield_staff_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Navigation & Active View state: 'dashboard', 'map', 'staff', 'login'
  const [activeView, setActiveView] = useState('dashboard');
  const [userRole, setUserRole] = useState(() => {
    try {
      const saved = localStorage.getItem('civicshield_staff_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed?.role || 'citizen';
      }
    } catch {}
    return 'citizen';
  });
  const [viewLayout, setViewLayout] = useState('grid'); // 'grid' or 'list'

  // Incident & Stats Data state
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });

  // Filters & Search state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedUrgency, setSelectedUrgency] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' or 'urgency'

  // Modals & Focused Incident state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [trackModalOpen, setTrackModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [focusedIncident, setFocusedIncident] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const mapSectionRef = useRef(null);

  // Fetch Dashboard Statistics
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await api.getStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.warn('Could not load stats:', err.message);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch Incidents list
  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await api.getIncidents({
        search,
        category: selectedCategory,
        urgency: selectedUrgency,
        status: selectedStatus,
        sort: sortBy,
        page: pagination.page,
        limit: pagination.limit
      });

      if (res.success && res.data) {
        setIncidents(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      console.error('Error fetching incidents:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  useEffect(() => {
    fetchIncidents();
  }, [search, selectedCategory, selectedUrgency, selectedStatus, sortBy, pagination.page, refreshTrigger]);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleIncidentUpdated = () => {
    handleRefresh();
  };

  const handleSelectIncident = async (incident) => {
    if (!incident) {
      setSelectedIncident(null);
      return;
    }
    setSelectedIncident(incident);

    try {
      const res = await api.getIncidentById(incident.id || incident.reference_id);
      if (res && res.data) {
        setSelectedIncident(res.data);
      }
    } catch (err) {
      console.warn('Could not load fresh incident details:', err.message);
    }
  };

  const handleFlyToLocation = (incident) => {
    soundFx.playRadioChirp();
    setFocusedIncident(incident);
    if (activeView !== 'dashboard') {
      setActiveView('dashboard');
    }
    setTimeout(() => {
      mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);
  };

  const clearFilters = () => {
    soundFx.playClick();
    setSearch('');
    setSelectedCategory('');
    setSelectedUrgency('');
    setSelectedStatus('');
  };

  const handleLoginSuccess = (user) => {
    setAuthUser(user);
    setUserRole(user.role);
    setActiveView('staff');
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {}
    localStorage.removeItem('civicshield_session_token');
    localStorage.removeItem('civicshield_staff_user');
    localStorage.removeItem('civicshield_staff_role');
    localStorage.removeItem('civicshield_staff_id');
    setAuthUser(null);
    setUserRole('citizen');
    setActiveView('dashboard');
  };

  const hasActiveFilters = Boolean(search || selectedCategory || selectedUrgency || selectedStatus);

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col font-sans">
      
      {/* 1. Global Navigation Bar */}
      <Navbar
        onOpenReport={() => setReportModalOpen(true)}
        onOpenTrack={() => setTrackModalOpen(true)}
        activeView={activeView}
        setActiveView={setActiveView}
        authUser={authUser}
        onOpenLogin={() => {
          soundFx.playClick();
          setActiveView('login');
        }}
        onLogout={handleLogout}
      />

      {/* 2. Top Municipal Dispatch Status Bar */}
      <aside aria-label="System status telemetry" className="bg-[#090d14] border-b border-[#1a2333] px-4 py-1.5 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center space-x-2 font-mono text-[11px] truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            <span className="font-semibold text-slate-200">MUNICIPAL SERVICE DISPATCH:</span>
            <span className="text-slate-400 hidden sm:inline">
              Operational • {stats?.total ?? 0} Total Logged • {stats?.critical ?? 0} Priority 1 Active • {stats?.resolved ?? 0} Closed
            </span>
          </div>

          <div className="flex items-center space-x-3 text-[11px] text-slate-400 shrink-0 font-medium">
            <span className="hidden md:inline">Coverage: Sectors 1–4, Harborfront, Northgate</span>
            <button
              onClick={() => {
                soundFx.playClick();
                handleRefresh();
              }}
              className="text-slate-300 hover:text-white flex items-center space-x-1 transition-colors"
              title="Refresh telemetry"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Sync</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 3. Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* ============================================================== */}
        {/* VIEW A: DEDICATED LOGIN PORTAL FOR ADMIN & FIELD CREW */}
        {/* ============================================================== */}
        {activeView === 'login' ? (
          <StaffLogin
            onLoginSuccess={handleLoginSuccess}
            onCancel={() => setActiveView('dashboard')}
          />
        ) : activeView === 'staff' ? (
          /* ============================================================== */
          /* VIEW B: STAFF & DISPATCHER PORTAL (AUTH PROTECTED) */
          /* ============================================================== */
          !authUser ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-950/50 border border-amber-800/80 rounded-xl text-xs text-amber-200 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>Restricted Municipal Terminal:</strong> You must authenticate with valid Administrator, Dispatcher, or Field Crew credentials to access operational dispatch.
                  </span>
                </div>
              </div>
              <StaffLogin
                onLoginSuccess={handleLoginSuccess}
                onCancel={() => setActiveView('dashboard')}
              />
            </div>
          ) : (
            <StaffPortal
              userRole={userRole}
              setUserRole={setUserRole}
              onSelectIncident={handleSelectIncident}
              refreshTrigger={refreshTrigger}
              onIncidentUpdated={handleIncidentUpdated}
              authUser={authUser}
              onLogout={handleLogout}
            />
          )
        ) : activeView === 'map' ? (
          /* ============================================================== */
          /* VIEW B: DEDICATED FULL LIVE MAP RADAR */
          /* ============================================================== */
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#111726] p-4 rounded-lg border border-[#1e293b]">
              <div>
                <h1 className="text-xl font-bold text-white flex items-center space-x-2">
                  <span>Municipal Emergency Geospatial Radar</span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time geographic distribution of reported public infrastructure hazards and field crew response points.
                </p>
              </div>

              <button
                onClick={() => setActiveView('dashboard')}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-[#162032] hover:bg-[#1d2b42] text-slate-300 border border-[#22314a] transition-colors flex items-center space-x-1.5"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-sky-400" />
                <span>Return to Feed</span>
              </button>
            </div>

            <IncidentMap
              incidents={incidents}
              onSelectIncident={handleSelectIncident}
              onIncidentUpdated={handleIncidentUpdated}
              focusedIncident={focusedIncident}
            />
          </div>
        ) : (
          /* ============================================================== */
          /* VIEW C: PUBLIC CITIZEN DASHBOARD */
          /* ============================================================== */
          <div className="space-y-6">
            
            {/* Grounded Institutional Split Hero Section */}
            <div className="bg-[#111726] border border-[#1e293b] rounded-xl p-6 sm:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                
                {/* Left Column: Purpose & Clear Mandate */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded bg-[#182338] border border-[#263753] text-[11px] font-semibold text-sky-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                    <span>Department of Public Works • Emergency Response 311</span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                    Municipal Infrastructure Safety & Rapid Outage Dispatch
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                    Report fallen electrical wires, water main breaches, and roadway structural hazards directly to city dispatch teams. Every ticket is logged, audited, and tracked to certified on-site resolution.
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-2.5">
                    <button
                      onClick={() => {
                        soundFx.playAlert();
                        setReportModalOpen(true);
                      }}
                      className="px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 shadow-xs flex items-center space-x-2 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Report Infrastructure Hazard</span>
                    </button>

                    <button
                      onClick={() => {
                        soundFx.playClick();
                        setTrackModalOpen(true);
                      }}
                      className="px-3.5 py-2.5 rounded-lg text-xs font-medium text-slate-200 bg-[#172033] hover:bg-[#1d2940] border border-[#26354d] flex items-center space-x-1.5 transition-colors"
                    >
                      <Search className="w-3.5 h-3.5 text-slate-400" />
                      <span>Track by Reference ID</span>
                    </button>

                    <button
                      onClick={() => {
                        soundFx.playRadioChirp();
                        mapSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-3 py-2.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-[#151c2c] transition-colors"
                    >
                      <span>View Map ↓</span>
                    </button>
                  </div>
                </div>

                {/* Right Column: Operational SLA & Performance Panel */}
                <div className="lg:col-span-5 bg-[#0d131f] border border-[#1e293b] rounded-lg p-5 space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-[#1e293b]">
                    <span className="text-xs font-semibold text-slate-300">
                      Response Standards & SLA Telemetry
                    </span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800 font-medium">
                      Active SLA
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded bg-[#111726] border border-[#1e293b]">
                      <span className="text-[11px] text-slate-400 block">Priority 1 SLA</span>
                      <strong className="text-sm font-semibold text-white block mt-0.5">&lt; 60 Mins</strong>
                      <span className="text-[10px] text-slate-500">From verified citizen report</span>
                    </div>

                    <div className="p-2.5 rounded bg-[#111726] border border-[#1e293b]">
                      <span className="text-[11px] text-slate-400 block">Avg Mobilization</span>
                      <strong className="text-sm font-semibold text-sky-400 block mt-0.5">24 Mins</strong>
                      <span className="text-[10px] text-slate-500">Across all municipal sectors</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-400 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span>On-Site Photographic Audit</span>
                      <span className="text-slate-200 font-medium">100% Required</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span>Duplicate Filtering Window</span>
                      <span className="text-slate-200 font-medium">24 Hours / 500m</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Dynamic Telemetry KPI Counters & Category Filters */}
            <StatsCounter
              stats={stats}
              loading={statsLoading}
              onCategorySelect={(cat) => setSelectedCategory(cat)}
              selectedCategory={selectedCategory}
              onStatusFilter={(st) => setSelectedStatus(st)}
              selectedStatus={selectedStatus}
              onUrgencyFilter={(ug) => setSelectedUrgency(ug)}
              selectedUrgency={selectedUrgency}
            />

            {/* Embedded Live Geospatial Map Section */}
            <div ref={mapSectionRef} className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h2 className="text-sm sm:text-base font-semibold text-white flex items-center space-x-1.5">
                    <Map className="w-4 h-4 text-sky-400" />
                    <span>Geospatial Incident Radar</span>
                  </h2>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    LIVE
                  </span>
                </div>
                <button
                  onClick={() => {
                    soundFx.playClick();
                    setActiveView('map');
                  }}
                  className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center space-x-1"
                >
                  <span>Dedicated Full Radar</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <IncidentMap
                incidents={incidents}
                onSelectIncident={handleSelectIncident}
                onIncidentUpdated={handleIncidentUpdated}
                focusedIncident={focusedIncident}
              />
            </div>

            {/* Incident Feed Controls Toolbar */}
            <div className="bg-[#111726] rounded-lg border border-[#1e293b] p-3 space-y-3">
              <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                
                {/* Search Field */}
                <div className="w-full md:w-96 relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by title, landmark, sector, or Reference ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-[#0d131f] border border-[#1e293b] rounded-md text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-500"
                  />
                </div>

                {/* Filters & View Toggle */}
                <div className="flex items-center flex-wrap gap-2 w-full md:w-auto">
                  
                  {/* Urgency Filter */}
                  <select
                    value={selectedUrgency}
                    onChange={(e) => setSelectedUrgency(e.target.value)}
                    className="px-2.5 py-1.5 bg-[#0d131f] border border-[#1e293b] rounded-md text-xs text-slate-200 focus:outline-hidden focus:border-sky-500"
                  >
                    <option value="">All Urgencies</option>
                    <option value="Critical">Critical Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>

                  {/* Status Filter */}
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-2.5 py-1.5 bg-[#0d131f] border border-[#1e293b] rounded-md text-xs text-slate-200 focus:outline-hidden focus:border-sky-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Acknowledged">Acknowledged</option>
                    <option value="Dispatched">Dispatched</option>
                    <option value="On Site">On Site</option>
                    <option value="Resolved">Resolved</option>
                  </select>

                  {/* Sort Filter */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-2.5 py-1.5 bg-[#0d131f] border border-[#1e293b] rounded-md text-xs text-slate-200 focus:outline-hidden focus:border-sky-500"
                  >
                    <option value="newest">Sort: Most Recent</option>
                    <option value="urgency">Sort: Critical First</option>
                  </select>

                  {/* Layout Grid / List View Toggle */}
                  <div className="flex items-center bg-[#0d131f] border border-[#1e293b] rounded-md p-0.5">
                    <button
                      onClick={() => setViewLayout('grid')}
                      className={`p-1 rounded ${viewLayout === 'grid' ? 'bg-[#1e293b] text-white' : 'text-slate-400 hover:text-slate-200'}`}
                      title="Grid Layout"
                      aria-label="Grid Layout"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setViewLayout('list')}
                      className={`p-1 rounded ${viewLayout === 'list' ? 'bg-[#1e293b] text-white' : 'text-slate-400 hover:text-slate-200'}`}
                      title="Dense Table Layout"
                      aria-label="Dense Table Layout"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Clear Filters Button */}
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-[#0d131f] border border-[#1e293b] rounded-md transition-colors"
                    >
                      Reset
                    </button>
                  )}

                  <button
                    onClick={handleRefresh}
                    className="p-1.5 text-slate-400 hover:text-white bg-[#0d131f] border border-[#1e293b] rounded-md transition-colors"
                    title="Refresh data"
                    aria-label="Refresh data"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            </div>

            {/* Incidents Feed / Table Container */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
                  <span>Incident Registry Queue</span>
                  <span className="text-xs text-slate-500 font-normal">
                    ({pagination.total} records)
                  </span>
                </h2>
              </div>

              {loading ? (
                <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
                  <span className="text-xs font-medium">Synchronizing reports from municipal database...</span>
                </div>
              ) : incidents.length === 0 ? (
                <div className="p-10 text-center bg-[#111726] rounded-lg border border-[#1e293b] space-y-2">
                  <AlertCircle className="w-6 h-6 text-slate-500 mx-auto" />
                  <h3 className="text-xs font-semibold text-slate-200">No Incidents Matching Filters</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Try clearing search criteria or selecting all categories to view the complete public registry.
                  </p>
                  <button
                    onClick={clearFilters}
                    className="mt-2 px-3 py-1 bg-[#162032] hover:bg-[#1d2940] text-slate-300 text-xs rounded-md border border-[#26354d]"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : viewLayout === 'grid' ? (
                /* Grid Layout */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {incidents.map((incident) => (
                    <IncidentCard
                      key={incident.id}
                      incident={incident}
                      onSelect={handleSelectIncident}
                      onFlyToLocation={handleFlyToLocation}
                    />
                  ))}
                </div>
              ) : (
                /* Dense Institutional Dispatch Table */
                <div className="bg-[#111726] rounded-lg border border-[#1e293b] overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#0d131f] border-b border-[#1e293b] text-slate-400 font-medium text-[11px] uppercase tracking-wider">
                          <th className="py-2.5 px-4">Ref Code</th>
                          <th className="py-2.5 px-4">Hazard & Location</th>
                          <th className="py-2.5 px-4">Category</th>
                          <th className="py-2.5 px-4">Urgency</th>
                          <th className="py-2.5 px-4">Status</th>
                          <th className="py-2.5 px-4">Reported</th>
                          <th className="py-2.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e293b]">
                        {incidents.map((incident) => {
                          const CategoryIcon = getCategoryIcon(incident.category);
                          return (
                            <tr
                              key={incident.id}
                              onClick={() => handleSelectIncident(incident)}
                              className="hover:bg-[#162032] transition-colors cursor-pointer"
                            >
                              <td className="py-3 px-4 font-mono font-semibold text-slate-200 text-xs">
                                {incident.reference_id}
                              </td>
                              <td className="py-3 px-4 max-w-xs">
                                <span className="font-medium text-slate-100 block truncate">{incident.title}</span>
                                <span className="text-[11px] text-slate-400 truncate block">
                                  {incident.landmark} • {incident.area}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-300">
                                <div className="flex items-center space-x-1.5">
                                  <CategoryIcon className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{incident.category}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`text-[10px] px-2 py-0.5 rounded ${getUrgencyStyle(incident.urgency)}`}>
                                  {incident.urgency}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`text-[10px] px-2 py-0.5 rounded border ${getStatusStyle(incident.status)}`}>
                                  {incident.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                                {formatTimeAgo(incident.created_at)}
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFlyToLocation(incident);
                                  }}
                                  className="p-1 rounded text-slate-400 hover:text-sky-300 hover:bg-[#1f2d47] transition-colors mr-1"
                                  title="Locate on map"
                                  aria-label="Locate hazard on map"
                                >
                                  <Navigation className="w-3.5 h-3.5" />
                                </button>
                                <span className="text-xs font-medium text-sky-400 hover:text-sky-300">
                                  Inspect →
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* How It Works Municipal SLA Section */}
            <HowItWorks onOpenReport={() => setReportModalOpen(true)} />

          </div>
        )}

      </main>

      {/* 4. Global Modals */}
      <ReportHazardModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onSuccess={handleIncidentUpdated}
        onViewIncident={handleSelectIncident}
      />

      <TrackReferenceModal
        isOpen={trackModalOpen}
        onClose={() => setTrackModalOpen(false)}
        onFoundIncident={handleSelectIncident}
      />

      <IncidentDetailsModal
        incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
        onRefresh={handleRefresh}
      />

      {/* 5. Minimal Institutional Footer */}
      <footer className="mt-auto border-t border-[#1e293b] bg-[#090d14] py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-400">CivicShield Municipal Dispatch 311</span>
            <span className="text-slate-600">|</span>
            <span>Public Utility Infrastructure Management</span>
          </div>

          <div className="flex items-center space-x-4 text-[11px] text-slate-400">
            <span>Audit Trail Enabled</span>
            <span>ISO 27001 Certified Infrastructure</span>
            <span className="text-slate-500">© 2026 Municipal Public Works</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
