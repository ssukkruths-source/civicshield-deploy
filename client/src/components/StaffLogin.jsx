import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Lock, 
  Radio, 
  UserCheck, 
  Key, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  Loader2, 
  ShieldCheck, 
  Terminal, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api.js';
import { soundFx } from '../services/soundFx.js';

export default function StaffLogin({ onLoginSuccess, onCancel }) {
  // Portal Tab: 'dispatcher' (Admin / Dispatch) or 'field_crew' (Field Technicians)
  const [activePortal, setActivePortal] = useState('dispatcher');
  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberTerminal, setRememberTerminal] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handlePortalSwitch = (portal) => {
    soundFx.playClick();
    setActivePortal(portal);
    setErrorMessage('');
    setSuccessMessage('');
    // Clear inputs or keep based on convenience
    setIdentifier('');
    setPassword('');
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage('Please enter your Municipal Badge ID or Official Government Email.');
      soundFx.playAlert();
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your Security Passcode or Terminal PIN.');
      soundFx.playAlert();
      return;
    }

    setLoading(true);
    setErrorMessage('');
    soundFx.playClick();

    try {
      const res = await api.login({
        identifier: identifier.trim(),
        password: password.trim(),
        expectedRole: activePortal
      });

      if (res && res.success && res.data) {
        soundFx.playSuccess();
        setSuccessMessage(res.message || 'Identity verified. Authorizing workstation access...');
        
        // Persist session in localStorage
        const { token, user } = res.data;
        localStorage.setItem('civicshield_session_token', token);
        localStorage.setItem('civicshield_staff_role', user.role);
        localStorage.setItem('civicshield_staff_id', user.id);
        localStorage.setItem('civicshield_staff_user', JSON.stringify(user));

        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(user);
          }
        }, 750);
      } else {
        throw new Error(res?.error || 'Authentication rejected by municipal security gateway.');
      }
    } catch (err) {
      soundFx.playAlert();
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Auto-Fill Handlers
  const handleQuickFill = (demoId, demoPass, portal) => {
    soundFx.playClick();
    setActivePortal(portal);
    setIdentifier(demoId);
    setPassword(demoPass);
    setErrorMessage('');
  };

  const isDispatcherTab = activePortal === 'dispatcher';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Return to Public Citizen Portal button */}
      <div className="mb-6">
        <button
          onClick={() => {
            soundFx.playClick();
            if (onCancel) onCancel();
          }}
          className="inline-flex items-center space-x-2 text-xs font-medium text-slate-400 hover:text-white transition-colors bg-[#111726] border border-[#1e293b] hover:border-slate-700 px-3 py-1.5 rounded-lg"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Public Citizen Feed</span>
        </button>
      </div>

      {/* Main Restricted Access Card */}
      <div className="bg-[#111726] border border-[#1e293b] rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Institutional Top Security Banner */}
        <div className="bg-[#090d15] border-b border-[#1e293b] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-red-950/60 border border-red-700/60 flex items-center justify-center text-red-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-red-400">
                  Restricted Access Terminal
                </span>
                <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-[#1a2336] text-slate-300 rounded border border-[#2b3a55]">
                  Municipal Code § 311-Sec.4
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Authorized Municipal Personnel & Rapid Field Technicians Only
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Gateway Node: SEC-DISPATCH-01</span>
          </div>
        </div>

        {/* Portal Switching Segmented Tabs */}
        <div className="p-6 sm:p-8">
          
          <div className="text-center max-w-lg mx-auto mb-8">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              CivicShield Operational Authentication
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Public citizens cannot access internal triage dispatch or field crew work orders without verified municipal credentials. Select your operational role below to sign in.
            </p>
          </div>

          {/* Two Distinct Gateways Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto mb-8 bg-[#0d131f] p-1.5 rounded-xl border border-[#1e293b]">
            <button
              type="button"
              onClick={() => handlePortalSwitch('dispatcher')}
              className={`p-3.5 rounded-lg flex items-center space-x-3 transition-all text-left ${
                isDispatcherTab
                  ? 'bg-sky-600 text-white shadow-md font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#141b29]'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                isDispatcherTab ? 'bg-sky-700 text-white' : 'bg-[#182338] text-sky-400'
              }`}>
                <Radio className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold leading-tight">Admin & Dispatcher</div>
                <div className={`text-[10px] truncate ${isDispatcherTab ? 'text-sky-100' : 'text-slate-500'}`}>
                  Central Triage & HQ Operations
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handlePortalSwitch('field_crew')}
              className={`p-3.5 rounded-lg flex items-center space-x-3 transition-all text-left ${
                !isDispatcherTab
                  ? 'bg-amber-600 text-white shadow-md font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#141b29]'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                !isDispatcherTab ? 'bg-amber-700 text-white' : 'bg-[#291e13] text-amber-400'
              }`}>
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold leading-tight">Field Response Crew</div>
                <div className={`text-[10px] truncate ${!isDispatcherTab ? 'text-amber-100' : 'text-slate-500'}`}>
                  Rapid Utility & Repair Teams
                </div>
              </div>
            </button>
          </div>

          {/* Form Box */}
          <div className="max-w-md mx-auto">
            
            {/* Context Notice for chosen tab */}
            <div className={`p-3 rounded-lg border text-xs mb-6 flex items-start space-x-2.5 ${
              isDispatcherTab 
                ? 'bg-sky-950/40 border-sky-800/60 text-sky-200' 
                : 'bg-amber-950/40 border-amber-800/60 text-amber-200'
            }`}>
              {isDispatcherTab ? (
                <Radio className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              ) : (
                <UserCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-semibold block">
                  {isDispatcherTab 
                    ? 'Municipal Dispatcher & Admin Gateway' 
                    : 'Rapid Field Technician Gateway'}
                </span>
                <span className="text-[11px] opacity-90 leading-relaxed block mt-0.5">
                  {isDispatcherTab
                    ? 'Grants clearance to prioritize incoming hazard reports, acknowledge emergency status, and dispatch certified repair personnel.'
                    : 'Grants access to active field assignments, on-site hazard cordon confirmation, and photographic completion upload.'}
                </span>
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-950/70 border border-red-800 rounded-lg text-xs text-red-200 flex items-start space-x-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold block">Authentication Failure</span>
                  <span className="text-[11px] text-red-300 mt-0.5 block">{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Success Message Alert */}
            {successMessage && (
              <div className="mb-4 p-3 bg-emerald-950/80 border border-emerald-800 rounded-lg text-xs text-emerald-200 flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {isDispatcherTab ? 'Dispatcher Badge ID or Municipal Email' : 'Field Technician Badge or Unit ID'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={isDispatcherTab ? 'e.g. DSP-104 or davis@civicshield.gov' : 'e.g. FC-402 or rivera@civicshield.gov'}
                    className="w-full px-3.5 py-2.5 bg-[#0d131f] border border-[#1e293b] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-500 font-mono"
                    disabled={loading}
                    required
                  />
                  <div className="absolute right-3 top-2.5 text-[10px] text-slate-500 uppercase font-mono">
                    ID
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    {isDispatcherTab ? 'Security Passcode / Master Key' : 'Mobile Workstation Access PIN'}
                  </label>
                  <span className="text-[10px] text-slate-500">
                    Case-sensitive
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isDispatcherTab ? 'Enter admin/dispatcher passcode' : 'Enter field crew PIN'}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-[#0d131f] border border-[#1e293b] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-500 font-mono"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                    title={showPassword ? 'Hide passcode' : 'Show passcode'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberTerminal}
                    onChange={(e) => setRememberTerminal(e.target.checked)}
                    className="rounded bg-[#0d131f] border-[#1e293b] text-sky-600 focus:ring-0"
                  />
                  <span className="text-[11px]">Remember authorized terminal</span>
                </label>
                <span className="text-[10px] text-slate-500 font-mono">256-Bit TLS</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2.5 px-4 rounded-lg text-xs font-semibold text-white shadow-md transition-all flex items-center justify-center space-x-2 ${
                  isDispatcherTab
                    ? 'bg-sky-600 hover:bg-sky-500 active:bg-sky-700'
                    : 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700'
                } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials with Bureau...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-3.5 h-3.5" />
                    <span>
                      {isDispatcherTab ? 'Authorize Central Dispatch Access' : 'Authorize Field Terminal Access'}
                    </span>
                  </>
                )}
              </button>
            </form>

            {/* Quick 1-Click Evaluation Credentials for Testing */}
            <div className="mt-8 pt-6 border-t border-[#1e293b]">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-semibold text-slate-300 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  <span>Quick Demo Personnel Logins:</span>
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                  1-Click Fill
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('DSP-104', 'admin', 'dispatcher')}
                  className="p-2 text-left bg-[#0d131f] hover:bg-[#141c2c] border border-[#1e293b] hover:border-sky-800 rounded-lg text-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-sky-300">Officer Davis</span>
                    <span className="text-[9px] px-1 py-0.2 bg-sky-950 text-sky-400 border border-sky-800 rounded font-mono">
                      DSP-104
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Central Emergency Dispatcher</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('ADM-001', 'admin', 'dispatcher')}
                  className="p-2 text-left bg-[#0d131f] hover:bg-[#141c2c] border border-[#1e293b] hover:border-purple-800 rounded-lg text-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-purple-300">Cmdr. Jenkins</span>
                    <span className="text-[9px] px-1 py-0.2 bg-purple-950 text-purple-400 border border-purple-800 rounded font-mono">
                      ADM-001
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Municipal Operations Admin</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('FC-402', 'crew', 'field_crew')}
                  className="p-2 text-left bg-[#0d131f] hover:bg-[#141c2c] border border-[#1e293b] hover:border-amber-800 rounded-lg text-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-300">Alex Rivera</span>
                    <span className="text-[9px] px-1 py-0.2 bg-amber-950 text-amber-400 border border-amber-800 rounded font-mono">
                      FC-402
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Rapid Electrical Response Unit</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('FC-209', 'crew', 'field_crew')}
                  className="p-2 text-left bg-[#0d131f] hover:bg-[#141c2c] border border-[#1e293b] hover:border-emerald-800 rounded-lg text-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-300">Maya Chen</span>
                    <span className="text-[9px] px-1 py-0.2 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded font-mono">
                      FC-209
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Roadway Safety & Structural Tech</div>
                </button>
              </div>

              <p className="text-[10px] text-slate-500 text-center mt-3">
                Click any profile above to instantly populate credentials and test the role boundary.
              </p>
            </div>

          </div>

        </div>

        {/* Security Compliance Footer */}
        <div className="bg-[#090d15] border-t border-[#1e293b] px-6 py-3 text-center text-[10px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>CivicShield Audit Enforcement Active • All IP logins timestamped</span>
          </div>
          <span>Public Works Emergency Telecommunications Bureau</span>
        </div>

      </div>
    </div>
  );
}
