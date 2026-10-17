import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import StatsCounter from './components/StatsCounter.jsx';
import IncidentCard from './components/IncidentCard.jsx';
import IncidentMap from './components/IncidentMap.jsx';
import ReportHazardModal from './components/ReportHazardModal.jsx';
import IncidentDetailsModal from './components/IncidentDetailsModal.jsx';
import TrackReferenceModal from './components/TrackReferenceModal.jsx';
import StaffPortal from './components/StaffPortal.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import { api } from './services/api.js';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  PlusCircle, 
  Map, 
  LayoutGrid, 
  Loader2, 
  ShieldAlert, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export default function App() {
  // Navigation & Active View state
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard', 'map', 'staff'
  const [userRole, setUserRole] = useState(localStorage.getItem('civicshield_staff_role') || 'citizen');

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

  // Modals state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [trackModalOpen, setTrackModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch Dashboard Statistics from real backend API
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

  // Fetch Incidents list with filtering, searching, and sorting
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
    // Set immediate data so modal opens without delay
    setSelectedIncident(incident);

    // Fetch full incident record with joined logs
    try {
      const res = await api.getIncidentById(incident.id || incident.reference_id);
      if (res && res.data) {
        setSelectedIncident(res.data);
      }
    } catch (err) {
      console.warn('Could not load fresh incident details, using cached:', err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-teal-500 selection:text-white">
      
      {/* 1. Global Navigation Bar */}
      <Navbar
        onOpenReport={() => setReportModalOpen(true)}
        onOpenTrack={() => setTrackModalOpen(true)}
        activeView={activeView}
        setActiveView={setActiveView}
        userRole={userRole}
        setUserRole={setUserRole}
      />

      {/* 2. Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* ============================================================== */}
        {/* VIEW A: STAFF & DISPATCHER PORTAL */}
        {/* ============================================================== */}
        {activeView === 'staff' ? (
          <StaffPortal
            userRole={userRole}
            setUserRole={setUserRole}
            onSelectIncident={handleSelectIncident}
            refreshTrigger={refreshTrigger}
            onIncidentUpdated={handleIncidentUpdated}
          />
        ) : (
          /* ============================================================== */
          /* VIEW B & C: PUBLIC CITIZEN DASHBOARD & MAP */
          /* ============================================================== */
          <div className="space-y-8">
            
            {/* Hero Banner Section */}
            <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-navy-800 to-slate-900 text-white p-6 sm:p-10 shadow-xl overflow-hidden border border-slate-800">
              <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none hidden md:block">
                <ShieldAlert className="w-full h-full text-teal-400" />
              </div>

              <div className="relative z-10 max-w-2xl space-y-3">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                  <span>Municipal Emergency Infrastructure Dispatcher</span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight brand-font text-white leading-tight">
                  Rapid Civic Hazard Reporting & Public Utility Dispatch
                </h1>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Fallen electrical lines, burst mains, broken roads, and open manholes pose immediate threats to public safety. CivicShield bridges citizens directly to authorized repair crews with transparent tracking.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setReportModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 shadow-md shadow-teal-500/30 flex items-center space-x-2 transition-all transform active:scale-95"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Report Infrastructure Hazard</span>
                  </button>

                  <button
                    onClick={() => setActiveView(activeView === 'map' ? 'dashboard' : 'map')}
                    className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center space-x-2 transition-colors"
                  >
                    {activeView === 'map' ? (
                      <>
                        <LayoutGrid className="w-4 h-4 text-teal-400" />
                        <span>View Incident Grid</span>
                      </>
                    ) : (
                      <>
                        <Map className="w-4 h-4 text-teal-400" />
                        <span>Open Live Map</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setTrackModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:text-white underline underline-offset-4 transition-colors"
                  >
                    Have a Reference ID? Track here →
                  </button>
                </div>
              </div>
            </div>

            {/* Dynamic Database Statistics Counter */}
            <StatsCounter
              stats={stats}
              loading={statsLoading}
              onCategorySelect={(cat) => setSelectedCategory(cat)}
              selectedCategory={selectedCategory}
            />

            {/* If Map View is selected */}
            {activeView === 'map' && (
              <IncidentMap
                incidents={incidents}
                onSelectIncident={handleSelectIncident}
              />
            )}

            {/* Filter & Search Controls Toolbar */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
              <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                
                {/* Search Field */}
                <div className="w-full md:w-96 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search by hazard title, landmark, or sector..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                {/* Dropdown Filters */}
                <div className="flex items-center flex-wrap gap-2 w-full md:w-auto">
                  
                  {/* Urgency Filter */}
                  <select
                    value={selectedUrgency}
                    onChange={(e) => setSelectedUrgency(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-teal-500 focus:outline-none"
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
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="">All Statuses</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Acknowledged">Acknowledged</option>
                    <option value="Dispatched">Dispatched</option>
                    <option value="On Site">On Site</option>
                    <option value="Resolved">Resolved</option>
                  </select>

                  {/* Sorting dropdown */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="newest">Sort: Newest First</option>
                    <option value="urgency">Sort: Highest Urgency</option>
                  </select>

                  {/* Refresh Button */}
                  <button
                    onClick={handleRefresh}
                    className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
                    title="Refresh data"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            </div>

            {/* Incidents Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900 brand-font flex items-center space-x-2">
                  <span>Recent Public Incident Reports</span>
                  <span className="text-xs text-slate-400 font-normal">
                    ({pagination.total} records found)
                  </span>
                </h2>
              </div>

              {loading ? (
                <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
                  <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                  <span className="text-xs font-medium">Loading reports from municipal database...</span>
                </div>
              ) : incidents.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
                  <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-700">No Incidents Found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    No active hazard reports match the selected filters or search terms.
                  </p>
                  <button
                    onClick={() => {
                      setSearch('');
                      setSelectedCategory('');
                      setSelectedUrgency('');
                      setSelectedStatus('');
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {incidents.map((incident) => (
                    <IncidentCard
                      key={incident.id}
                      incident={incident}
                      onSelect={handleSelectIncident}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* How It Works Explainer Section */}
            <HowItWorks onOpenReport={() => setReportModalOpen(true)} />

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 border-t border-slate-800 text-xs py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-teal-600 flex items-center justify-center text-white">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-200 brand-font">CivicShield</span>
            <span className="text-slate-500">| Municipal Infrastructure & Utility Outage Dispatcher</span>
          </div>
          <div className="flex items-center space-x-6 text-[11px] text-slate-400">
            <span>Hackathon Evaluation Edition</span>
            <span>•</span>
            <span>PostgreSQL & Supabase Architecture</span>
            <span>•</span>
            <span>Vite + React + Express</span>
          </div>
        </div>
      </footer>

      {/* ============================================================== */}
      {/* GLOBAL MODALS */}
      {/* ============================================================== */}
      
      {/* Report Hazard Submission Modal */}
      <ReportHazardModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onSuccess={() => {
          handleRefresh();
        }}
        onViewIncident={(inc) => setSelectedIncident(inc)}
      />

      {/* Incident Details & Progress Timeline Modal */}
      <IncidentDetailsModal
        incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
        onRefresh={handleRefresh}
      />

      {/* Track by Reference ID Modal */}
      <TrackReferenceModal
        isOpen={trackModalOpen}
        onClose={() => setTrackModalOpen(false)}
        onFoundIncident={(inc) => setSelectedIncident(inc)}
      />

    </div>
  );
}
