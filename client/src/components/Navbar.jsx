import React, { useState } from 'react';
import { 
  ShieldAlert, 
  PlusCircle, 
  Search, 
  Radio, 
  UserCheck, 
  Users, 
  MapPin, 
  ExternalLink,
  ChevronDown,
  Layers
} from 'lucide-react';

export default function Navbar({ 
  onOpenReport, 
  onOpenTrack, 
  activeView, 
  setActiveView, 
  userRole, 
  setUserRole 
}) {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const roles = [
    { id: 'citizen', label: 'Citizen View (Public)', icon: Users, badge: 'Public' },
    { id: 'dispatcher', label: 'Dispatcher / Admin', icon: Radio, badge: 'Staff Admin' },
    { id: 'field_crew', label: 'Field Crew Tech', icon: UserCheck, badge: 'Rapid Response' }
  ];

  const handleRoleChange = (roleId) => {
    setUserRole(roleId);
    localStorage.setItem('civicshield_staff_role', roleId);
    setRoleDropdownOpen(false);
    if (roleId !== 'citizen') {
      setActiveView('staff');
    } else {
      setActiveView('dashboard');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-3">
          
          {/* Logo & Civic Branding */}
          <div 
            onClick={() => setActiveView('dashboard')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-white brand-font">
                  Civic<span className="text-teal-400">Shield</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-teal-950 text-teal-300 border border-teal-800/80 rounded-full">
                  GovTech Dispatch
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Report hazards. Track action. Protect communities.
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            
            {/* View Switcher Tabs */}
            <div className="hidden md:flex items-center bg-slate-800/90 p-1 rounded-lg border border-slate-700/80">
              <button
                onClick={() => setActiveView('dashboard')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeView === 'dashboard'
                    ? 'bg-teal-600 text-white shadow'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                Public Board
              </button>
              <button
                onClick={() => setActiveView('map')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeView === 'map'
                    ? 'bg-teal-600 text-white shadow'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                Live Map
              </button>
              <button
                onClick={() => setActiveView('staff')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeView === 'staff'
                    ? 'bg-teal-600 text-white shadow'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                Staff Portal
              </button>
            </div>

            {/* Track Incident Modal Trigger */}
            <button
              onClick={onOpenTrack}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition-colors"
              title="Track incident by Reference ID"
            >
              <Search className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">Track by ID</span>
            </button>

            {/* Primary Report Hazard CTA */}
            <button
              onClick={onOpenReport}
              className="flex items-center space-x-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 rounded-lg shadow-sm shadow-teal-500/30 hover:shadow-teal-500/50 transition-all transform active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Hazard</span>
            </button>

            {/* Role / Persona Switcher for Hackathon Demo Testing */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center space-x-2 px-2.5 py-2 text-xs bg-slate-800 hover:bg-slate-700/90 border border-slate-700 rounded-lg text-slate-200 transition-colors"
                title="Switch Active Persona for Demo"
              >
                <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></div>
                <span className="hidden lg:inline capitalize font-medium">
                  {userRole.replace('_', ' ')}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700/60">
                    Switch Active User Role
                  </div>
                  {roles.map((r) => {
                    const Icon = r.icon;
                    const isCurrent = userRole === r.id;
                    return (
                      <button
                        key={r.id}
                        onClick={() => handleRoleChange(r.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                          isCurrent
                            ? 'bg-teal-950/70 text-teal-300 border-l-2 border-teal-400'
                            : 'text-slate-200 hover:bg-slate-700/60'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <Icon className="w-4 h-4 text-slate-400" />
                          <span>{r.label}</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900/80 text-slate-400 font-mono">
                          {r.badge}
                        </span>
                      </button>
                    );
                  })}
                  <div className="px-3 pt-2 mt-1 border-t border-slate-700/60 text-[10px] text-slate-400">
                    💡 Simulates Supabase Auth profiles & dispatch roles.
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </header>
  );
}
