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
  VolumeX 
} from 'lucide-react';
import { soundFx } from '../services/soundFx.js';

export default function Navbar({ 
  onOpenReport, 
  onOpenTrack, 
  activeView, 
  setActiveView, 
  userRole, 
  setUserRole 
}) {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const roles = [
    { id: 'citizen', label: 'Citizen View (Public)', icon: Users, badge: 'Public' },
    { id: 'dispatcher', label: 'Dispatcher Triage', icon: Radio, badge: 'HQ Staff' },
    { id: 'field_crew', label: 'Field Response Tech', icon: UserCheck, badge: 'Rapid Unit' }
  ];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setRoleDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

            <button
              onClick={() => {
                soundFx.playRadioChirp();
                setActiveView('staff');
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center space-x-1.5 transition-colors ${
                activeView === 'staff'
                  ? 'bg-[#222e44] text-white shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a2336]'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dispatch Console</span>
              <span className="sm:hidden">Staff</span>
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
              <span>Report Hazard</span>
            </button>

            {/* Role Switcher Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center space-x-1.5 px-2 py-1.5 text-xs bg-[#141b29] hover:bg-[#1a2336] border border-[#222d42] rounded-md text-slate-300 transition-colors"
                title="Switch active operational persona"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span className="hidden xl:inline capitalize text-[11px] font-medium text-slate-300">
                  {userRole.replace('_', ' ')}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-60 bg-[#111726] border border-[#222d42] rounded-lg shadow-xl py-1 z-50">
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-[#1e293b]">
                    Operational Persona (Demo)
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
                            ? 'bg-sky-950/60 text-sky-300 border-l-2 border-sky-400'
                            : 'text-slate-300 hover:bg-[#172033]'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Icon className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium">{r.label}</span>
                        </div>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#1e293b] text-slate-400">
                          {r.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
