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
  User,
  Menu,
  X
} from 'lucide-react';
import { soundFx } from '../services/soundFx.js';

export default function Navbar({ 
  onOpenReport, 
  onOpenTrack, 
  activeView, 
  setActiveView, 
  authUser,
  userRole,
  onQuickSwitchRole,
  onOpenLogin,
  onLogout
}) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
  const isFieldCrew = authUser?.role === 'field_crew' || userRole === 'field_crew';
  const isAdminOrDispatcher = authUser?.role === 'admin' || authUser?.role === 'dispatcher' || userRole === 'dispatcher';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E4E9EF] shadow-[0_1px_3px_0_rgba(24,59,86,0.05)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Municipal Brand Identity */}
          <div 
            onClick={() => {
              soundFx.playClick();
              setActiveView('dashboard');
            }}
            className="flex items-center space-x-3 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 rounded-lg bg-[#E6F7F6] border border-[#BCE8E6] flex items-center justify-center text-[#20A39E] group-hover:bg-[#20A39E] group-hover:text-white transition-all shadow-xs">
              <ShieldAlert className="w-5 h-5 transition-transform group-hover:scale-105" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-tight text-[#183B56]">
                  Civic<span className="text-[#20A39E]">Shield</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-[#356B8C] bg-[#F0F6FA] rounded border border-[#D0E1ED]">
                  Dispatch 311
                </span>
              </div>
              <p className="text-[11px] text-[#697586] hidden md:block leading-none mt-0.5">
                Municipal Infrastructure Safety Registry
              </p>
            </div>
          </div>

          {/* Center Navigation Controls: Modern Segmented Switcher */}
          <nav className="hidden md:flex items-center space-x-1 bg-[#F0F4F8] p-1 rounded-xl border border-[#E4E9EF]">
            <button
              onClick={() => {
                soundFx.playRadioChirp();
                setActiveView('dashboard');
              }}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg flex items-center space-x-1.5 transition-all ${
                activeView === 'dashboard'
                  ? 'bg-white text-[#183B56] shadow-sm font-semibold'
                  : 'text-[#697586] hover:text-[#172B3A] hover:bg-white/60'
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
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg flex items-center space-x-1.5 transition-all ${
                activeView === 'map'
                  ? 'bg-white text-[#183B56] shadow-sm font-semibold'
                  : 'text-[#697586] hover:text-[#172B3A] hover:bg-white/60'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>Geospatial Radar</span>
            </button>

            {/* Municipal Dispatch Console / Field Workstation: ALWAYS ACCESSIBLE */}
            <button
              onClick={() => {
                soundFx.playRadioChirp();
                setActiveView('staff');
              }}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg flex items-center space-x-1.5 transition-all ${
                activeView === 'staff'
                  ? isFieldCrew 
                    ? 'bg-[#FEF9EE] text-[#D99A26] border border-[#F9DE9E] shadow-sm font-semibold' 
                    : 'bg-[#F0F6FA] text-[#183B56] border border-[#D0E1ED] shadow-sm font-semibold'
                  : 'text-[#697586] hover:text-[#172B3A] hover:bg-white/60'
              }`}
              title="Access Municipal Dispatcher & Field Crew Console"
            >
              {isStaffLoggedIn ? (
                isFieldCrew ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5 text-[#D99A26]" />
                    <span>Field Workstation</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#25855A] animate-pulse ml-0.5"></span>
                  </>
                ) : (
                  <>
                    <Radio className="w-3.5 h-3.5 text-[#20A39E]" />
                    <span>Dispatch Console</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#25855A] animate-pulse ml-0.5"></span>
                  </>
                )
              ) : (
                <>
                  <Radio className="w-3.5 h-3.5 text-[#356B8C]" />
                  <span>Dispatch Console</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold ml-0.5">
                    Staff
                  </span>
                </>
              )}
            </button>
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
              className="p-2 text-[#697586] hover:text-[#183B56] hover:bg-[#F0F4F8] border border-transparent hover:border-[#E4E9EF] rounded-lg transition-colors"
              title={soundFx.isEnabled() ? 'Mute Interface Audio' : 'Enable Interface Audio'}
              aria-label="Toggle Sound Effects"
            >
              {soundFx.isEnabled() ? (
                <Volume2 className="w-4 h-4 text-[#20A39E]" />
              ) : (
                <VolumeX className="w-4 h-4 text-[#94A3B8]" />
              )}
            </button>

            {/* Quick Track by Reference ID */}
            <button
              onClick={() => {
                soundFx.playClick();
                onOpenTrack();
              }}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-[#183B56] bg-white hover:bg-[#F7F8FA] border border-[#E4E9EF] hover:border-[#CBD5E1] rounded-lg transition-all shadow-xs"
              title="Track incident status with Reference ID"
            >
              <Search className="w-3.5 h-3.5 text-[#697586]" />
              <span>Track ID</span>
            </button>

            {/* Primary Action: Report Hazard */}
            <button
              onClick={() => {
                soundFx.playAlert();
                onOpenReport();
              }}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#20A39E] hover:bg-[#177e7a] active:bg-[#136663] rounded-lg shadow-sm hover:shadow transition-all"
            >
              <Plus className="w-4 h-4" />
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
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-[#183B56] hover:text-white bg-[#F0F6FA] hover:bg-[#183B56] border border-[#D0E1ED] hover:border-[#183B56] rounded-lg transition-all shadow-xs"
                title="Municipal staff & field response login"
              >
                <Lock className="w-3.5 h-3.5 text-[#356B8C]" />
                <span className="hidden sm:inline">Staff Login</span>
                <span className="sm:hidden">Staff</span>
              </button>
            ) : (
              /* Authenticated Staff: Officer Badge & Logout Control */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className={`flex items-center space-x-2 px-3 py-1.5 text-xs rounded-lg border transition-all ${
                    isFieldCrew
                      ? 'bg-[#FEF9EE] border-[#F9DE9E] text-[#D99A26] hover:bg-[#FDF4DC]'
                      : 'bg-[#F0F6FA] border-[#D0E1ED] text-[#183B56] hover:bg-[#E3EFF7]'
                  }`}
                  title="Active Authorized Terminal Identity"
                >
                  <span className={`w-2 h-2 rounded-full ${isFieldCrew ? 'bg-[#D99A26]' : 'bg-[#20A39E]'} animate-pulse`}></span>
                  <div className="flex flex-col text-left leading-none">
                    <span className="font-semibold text-xs text-[#183B56] truncate max-w-[110px] sm:max-w-[140px]">
                      {authUser.name || authUser.badge_number}
                    </span>
                    <span className="text-[10px] text-[#697586] capitalize font-mono mt-0.5">
                      {authUser.badge_number || authUser.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#697586]" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E4E9EF] rounded-xl shadow-panel py-2 z-50 divide-y divide-[#E4E9EF] animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-semibold text-[#697586] uppercase tracking-wider">
                          Active Workstation
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                          isFieldCrew 
                            ? 'bg-[#FEF9EE] text-[#D99A26] border border-[#F9DE9E]' 
                            : 'bg-[#F0F6FA] text-[#183B56] border border-[#D0E1ED]'
                        }`}>
                          {authUser.role.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-[#183B56]">{authUser.name}</div>
                      <div className="text-[11px] text-[#697586] font-mono mt-0.5">{authUser.email}</div>
                      <div className="text-[10px] text-[#697586] mt-1">{authUser.department || 'Municipal Operations Bureau'}</div>
                    </div>

                    <div className="p-1.5">
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          setActiveView('staff');
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-medium text-[#183B56] hover:bg-[#F0F6FA] rounded-lg transition-colors"
                      >
                        {isFieldCrew ? (
                          <UserCheck className="w-3.5 h-3.5 text-[#D99A26]" />
                        ) : (
                          <Radio className="w-3.5 h-3.5 text-[#20A39E]" />
                        )}
                        <span>Open {isFieldCrew ? 'Field Response Terminal' : 'Dispatch Console'}</span>
                      </button>
                    </div>

                    <div className="p-1.5">
                      <button
                        onClick={() => {
                          soundFx.playClick();
                          setProfileDropdownOpen(false);
                          if (onLogout) onLogout();
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-medium text-[#D64545] hover:bg-[#FDF2F2] rounded-lg transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Lock Terminal & Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#697586] hover:text-[#183B56] hover:bg-[#F0F4F8] rounded-lg border border-[#E4E9EF]"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E4E9EF] py-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  soundFx.playRadioChirp();
                  setActiveView('dashboard');
                  setMobileMenuOpen(false);
                }}
                className={`px-3 py-2 text-xs font-medium rounded-lg flex items-center space-x-2 ${
                  activeView === 'dashboard' ? 'bg-[#183B56] text-white' : 'bg-[#F0F4F8] text-[#183B56]'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Incident Feed</span>
              </button>

              <button
                onClick={() => {
                  soundFx.playRadioChirp();
                  setActiveView('map');
                  setMobileMenuOpen(false);
                }}
                className={`px-3 py-2 text-xs font-medium rounded-lg flex items-center space-x-2 ${
                  activeView === 'map' ? 'bg-[#183B56] text-white' : 'bg-[#F0F4F8] text-[#183B56]'
                }`}
              >
                <Map className="w-4 h-4" />
                <span>Geospatial Radar</span>
              </button>
            </div>

            <button
              onClick={() => {
                soundFx.playRadioChirp();
                setActiveView('staff');
                setMobileMenuOpen(false);
              }}
              className="w-full px-3 py-2 text-xs font-semibold rounded-lg flex items-center justify-between bg-[#F0F6FA] text-[#183B56] border border-[#D0E1ED]"
            >
              <span className="flex items-center space-x-2">
                <Radio className="w-4 h-4 text-[#20A39E]" />
                <span>
                  {isStaffLoggedIn
                    ? (isFieldCrew ? 'Field Response Terminal' : 'Municipal Dispatch Console')
                    : 'Municipal Dispatch Console'
                  }
                </span>
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                isStaffLoggedIn ? 'bg-[#25855A] text-white' : 'bg-amber-100 text-amber-800'
              }`}>
                {isStaffLoggedIn ? 'ACTIVE' : 'STAFF'}
              </span>
            </button>

            <button
              onClick={() => {
                soundFx.playClick();
                onOpenTrack();
                setMobileMenuOpen(false);
              }}
              className="w-full px-3 py-2 text-xs font-medium rounded-lg flex items-center space-x-2 bg-white border border-[#E4E9EF] text-[#183B56]"
            >
              <Search className="w-4 h-4 text-[#697586]" />
              <span>Track Reference ID</span>
            </button>
          </div>
        )}

      </div>
    </header>
  );
}
