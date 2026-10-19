import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldAlert, 
  Plus, 
  Search, 
  Radio, 
  UserCheck, 
  Users, 
  Map, 
  LayoutGrid, 
  ChevronDown, 
  Volume2, 
  VolumeX,
  Lock,
  LogOut,
  ShieldCheck,
  User
} from 'lucide-react';
import { soundFx } from '../services/soundFx.js';

export default function Navbar({ 
  onOpenReport, 
  onOpenTrack, 
  activeView, 
  setActiveView, 
  authUser,
  onOpenLogin,
  onLogout
}) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isStaffLoggedIn = !!authUser;
  const isFieldCrew = authUser?.role === 'field_crew';
  const isAdminOrDispatcher = authUser?.role === 'admin' || authUser?.role === 'dispatcher';

  return (
    <header className="sticky top-0 z-40 bg-[#0d131f] border-b border-[#1e293b] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Institutional Municipal Branding */}
          <div 
            onClick={() => setActiveView('dashboard')}
            className="flex items-center space-x-3 cursor-pointer select-none"
          >
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base tracking-tight text-white">
                  Civic<span className="text-sky-400">Shield</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-800/80 rounded border border-slate-700">
                  Municipal Dispatch 311
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden md:block">
                City Infrastructure Safety & Utility Outage Registry
              </p>
            </div>
          </div>

          {/* Center Navigation Controls: Segmented View Controller */}
          <nav className="flex items-center space-x-1 sm:space-x-1.5 bg-[#141b29] p-1 rounded-lg border border-[#222d42]">
            <button
              onClick={() => {
                soundFx.playRadioChirp();
                setActiveView('dashboard');
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center space-x-1.5 transition-colors ${
                activeView === 'dashboard'
                  ? 'bg-[#222e44] text-white shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a2336]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Incident Feed</span>
            </button>

            <button
              onClick={() => {
                soundFx.playRadioChirp();
                setActiveView('map');
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center space-x-1.5 transition-colors relative ${
                activeView === 'map'
                  ? 'bg-[#222e44] text-white shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a2336]'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>Geospatial Radar</span>
            </button>

            {/* Restricted Staff Console: ONLY VISIBLE IF AUTHENTICATED */}
            {isStaffLoggedIn && (
              <button
                onClick={() => {
                  soundFx.playRadioChirp();
                  setActiveView('staff');
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center space-x-1.5 transition-colors ${
                  activeView === 'staff'
                    ? isFieldCrew ? 'bg-amber-600/90 text-white shadow-xs font-semibold' : 'bg-sky-600/90 text-white shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a2336]'
                }`}
              >
                {isFieldCrew ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5 text-amber-300" />
                    <span className="hidden sm:inline">Field Workstation</span>
                    <span className="sm:hidden">Crew</span>
                  </>
                ) : (
                  <>
                    <Radio className="w-3.5 h-3.5 text-sky-300" />
                    <span className="hidden sm:inline">Dispatch Console</span>
                    <span className="sm:hidden">Dispatch</span>
                  </>
                )}
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5"></span>
              </button>
            )}
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center space-x-2">
            
            {/* Audio Feedback Toggle */}
            <button
              onClick={() => {
                const next = !soundFx.isEnabled();
                soundFx.setEnabled(next);
                if (next) soundFx.playRadioChirp();
              }}
              className="p-1.5 text-slate-400 hover:text-slate-200 bg-[#141b29] hover:bg-[#1a2336] border border-[#222d42] rounded-md transition-colors"
              title={soundFx.isEnabled() ? 'Mute Interface Audio' : 'Enable Interface Audio'}
              aria-label="Toggle Sound Effects"
            >
              {soundFx.isEnabled() ? (
                <Volume2 className="w-3.5 h-3.5 text-sky-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>

            {/* Quick Track by Reference ID */}
            <button
              onClick={() => {
                soundFx.playClick();
                onOpenTrack();
              }}
              className="hidden md:flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-[#141b29] hover:bg-[#1a2336] border border-[#222d42] rounded-md transition-colors"
              title="Track incident status with Reference ID"
            >
              <Search className="w-3 h-3 text-slate-400" />
              <span>Track ID</span>
            </button>

            {/* Primary Action: Report Hazard */}
            <button
              onClick={() => {
                soundFx.playAlert();
                onOpenReport();
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-md shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Report Hazard</span>
              <span className="sm:hidden">Report</span>
            </button>

            {/* ============================================================== */}
            {/* AUTHENTICATION GATEWAY: STAFF LOGIN VS LOGGED-IN IDENTITY */}
            {/* ============================================================== */}
            {!isStaffLoggedIn ? (
              /* Public View: Officer / Staff Login Button */
              <button
                onClick={() => {
                  soundFx.playClick();
                  if (onOpenLogin) onOpenLogin();
                }}
                className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-[#141b29] hover:bg-[#1b2538] border border-[#26354d] hover:border-sky-500/50 rounded-md transition-all shadow-xs"
                title="Municipal staff & field response login"
              >
                <Lock className="w-3 h-3 text-amber-400" />
                <span className="hidden sm:inline">Staff Login</span>
                <span className="sm:hidden">Login</span>
              </button>
            ) : (
              /* Authenticated Staff: Officer Badge & Logout Control */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className={`flex items-center space-x-2 px-2.5 py-1.5 text-xs rounded-md border transition-colors ${
                    isFieldCrew
                      ? 'bg-amber-950/40 border-amber-800/80 text-amber-200 hover:bg-amber-900/40'
                      : 'bg-sky-950/40 border-sky-800/80 text-sky-200 hover:bg-sky-900/40'
                  }`}
                  title="Active Authorized Terminal Identity"
                >
                  <span className={`w-2 h-2 rounded-full ${isFieldCrew ? 'bg-amber-400' : 'bg-sky-400'} animate-pulse`}></span>
                  <div className="flex flex-col text-left leading-none">
                    <span className="font-bold text-[11px] text-white truncate max-w-[110px] sm:max-w-[140px]">
                      {authUser.name || authUser.badge_number}
                    </span>
                    <span className="text-[9px] text-slate-400 capitalize font-mono">
                      {authUser.badge_number || authUser.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-64 bg-[#111726] border border-[#222d42] rounded-xl shadow-2xl py-2 z-50 divide-y divide-[#1e293b]">
                    <div className="px-3.5 py-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Active Workstation
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                          isFieldCrew ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-sky-950 text-sky-400 border border-sky-800'
                        }`}>
                          {authUser.role.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-white">{authUser.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{authUser.email}</div>
                      <div className="text-[10px] text-slate-500 mt-1">{authUser.department || 'Municipal Operations Bureau'}</div>
                    </div>

                    <div className="p-1">
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          setActiveView('staff');
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-slate-200 hover:bg-[#162032] rounded-md transition-colors"
                      >
                        {isFieldCrew ? (
                          <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <Radio className="w-3.5 h-3.5 text-sky-400" />
                        )}
                        <span>Open {isFieldCrew ? 'Field Response Terminal' : 'Dispatch Console'}</span>
                      </button>
                    </div>

                    <div className="p-1">
                      <button
                        onClick={() => {
                          soundFx.playClick();
                          setProfileDropdownOpen(false);
                          if (onLogout) onLogout();
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-md transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Lock Terminal & Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}
