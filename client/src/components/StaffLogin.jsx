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
          className="inline-flex items-center space-x-2 text-xs font-semibold text-[#183B56] hover:text-[#20A39E] transition-colors bg-white border border-[#E4E9EF] hover:bg-[#F7F8FA] px-3.5 py-2 rounded-lg shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Public Citizen Feed</span>
        </button>
      </div>

      {/* Main Restricted Access Card */}
      <div className="bg-white border border-[#E4E9EF] rounded-2xl shadow-elevated overflow-hidden">
        
        {/* Institutional Top Security Banner */}
        <div className="bg-[#F7F8FA] border-b border-[#E4E9EF] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-2xs">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                  Restricted Access Terminal
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-white text-[#697586] rounded-md border border-[#E4E9EF]">
                  Municipal Code § 311-Sec.4
                </span>
              </div>
              <p className="text-[11px] text-[#697586]">
                Authorized Municipal Personnel & Rapid Field Technicians Only
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-[#697586] font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium">Gateway Node: SEC-DISPATCH-01</span>
          </div>
        </div>

        {/* Portal Switching Segmented Tabs */}
        <div className="p-6 sm:p-8">
          
          <div className="text-center max-w-lg mx-auto mb-8">
            <h1 className="text-2xl font-bold text-[#183B56] tracking-tight">
              CivicShield Operational Authentication
            </h1>
            <p className="text-xs text-[#697586] mt-1.5 leading-relaxed">
              Public citizens cannot access internal triage dispatch or field crew work orders without verified municipal credentials. Select your operational role below to sign in.
            </p>
          </div>

          {/* Two Distinct Gateways Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto mb-8 bg-[#F7F8FA] p-1.5 rounded-xl border border-[#E4E9EF] shadow-2xs">
            <button
              type="button"
              onClick={() => handlePortalSwitch('dispatcher')}
              className={`p-3.5 rounded-lg flex items-center space-x-3 transition-all text-left ${
                isDispatcherTab
                  ? 'bg-[#183B56] text-white shadow-xs font-bold'
                  : 'text-[#697586] hover:text-[#183B56] hover:bg-[#EEF2F6]'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                isDispatcherTab ? 'bg-[#264c6d] text-white' : 'bg-white text-[#183B56] border border-[#E4E9EF]'
              }`}>
                <Radio className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold leading-tight">Admin & Dispatcher</div>
                <div className={`text-[10px] truncate ${isDispatcherTab ? 'text-slate-200' : 'text-[#697586]'}`}>
                  Central Triage & HQ Operations
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handlePortalSwitch('field_crew')}
              className={`p-3.5 rounded-lg flex items-center space-x-3 transition-all text-left ${
                !isDispatcherTab
                  ? 'bg-[#20A39E] text-white shadow-xs font-bold'
                  : 'text-[#697586] hover:text-[#183B56] hover:bg-[#EEF2F6]'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                !isDispatcherTab ? 'bg-[#188B87] text-white' : 'bg-white text-[#20A39E] border border-[#E4E9EF]'
              }`}>
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold leading-tight">Field Response Crew</div>
                <div className={`text-[10px] truncate ${!isDispatcherTab ? 'text-white/90' : 'text-[#697586]'}`}>
                  Rapid Utility & Repair Teams
                </div>
              </div>
            </button>
          </div>

          {/* Form Box */}
          <div className="max-w-md mx-auto">
            
            {/* Context Notice for chosen tab */}
            <div className={`p-3.5 rounded-xl border text-xs mb-6 flex items-start space-x-2.5 shadow-2xs ${
              isDispatcherTab 
                ? 'bg-[#F0FDFB] border-[#CCFBF1] text-[#188B87]' 
                : 'bg-amber-50/70 border-amber-200 text-amber-900'
            }`}>
              {isDispatcherTab ? (
                <Radio className="w-4 h-4 text-[#20A39E] shrink-0 mt-0.5" />
              ) : (
                <UserCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-bold block">
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
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start space-x-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold block">Authentication Failure</span>
                  <span className="text-[11px] text-rose-700 mt-0.5 block">{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Success Message Alert */}
            {successMessage && (
              <div className="mb-4 p-3.5 bg-[#EAF5EF] border border-[#C5E5D3] rounded-xl text-xs text-[#25855A] flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#25855A] shrink-0" />
                <span className="font-semibold">{successMessage}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#183B56] mb-1.5">
                  {isDispatcherTab ? 'Dispatcher Badge ID or Municipal Email' : 'Field Technician Badge or Unit ID'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={isDispatcherTab ? 'e.g. DSP-104 or davis@civicshield.gov' : 'e.g. FC-402 or rivera@civicshield.gov'}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E4E9EF] rounded-lg text-xs text-[#172B3A] placeholder-[#9AA4B2] focus:outline-hidden focus:border-[#20A39E] font-mono shadow-2xs"
                    disabled={loading}
                    required
                  />
                  <div className="absolute right-3 top-2.5 text-[10px] text-[#9AA4B2] uppercase font-mono font-semibold">
                    ID
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#183B56]">
                    {isDispatcherTab ? 'Security Passcode / Master Key' : 'Mobile Workstation Access PIN'}
                  </label>
                  <span className="text-[10px] text-[#697586]">
                    Case-sensitive
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isDispatcherTab ? 'Enter admin/dispatcher passcode' : 'Enter field crew PIN'}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-[#E4E9EF] rounded-lg text-xs text-[#172B3A] placeholder-[#9AA4B2] focus:outline-hidden focus:border-[#20A39E] font-mono shadow-2xs"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[#697586] hover:text-[#183B56]"
                    title={showPassword ? 'Hide passcode' : 'Show passcode'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-[#697586] pt-1">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberTerminal}
                    onChange={(e) => setRememberTerminal(e.target.checked)}
                    className="rounded bg-white border-[#E4E9EF] text-[#20A39E] focus:ring-0"
                  />
                  <span className="text-[11px] font-medium">Remember authorized terminal</span>
                </label>
                <span className="text-[10px] text-[#9AA4B2] font-mono">256-Bit TLS</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2.5 px-4 rounded-lg text-xs font-semibold text-white shadow-xs transition-all flex items-center justify-center space-x-2 ${
                  isDispatcherTab
                    ? 'bg-[#183B56] hover:bg-[#122e44] active:bg-[#0b1d2c]'
                    : 'bg-[#20A39E] hover:bg-[#188B87] active:bg-[#126b68]'
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
            <div className="mt-8 pt-6 border-t border-[#E4E9EF]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-[#183B56] flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#20A39E]" />
                  <span>Quick Demo Personnel Logins:</span>
                </span>
                <span className="text-[10px] text-[#697586] uppercase tracking-wider font-semibold">
                  1-Click Fill
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleQuickFill('DSP-104', 'admin', 'dispatcher')}
                  className="p-3 text-left bg-[#F7F8FA] hover:bg-[#EEF2F6] border border-[#E4E9EF] hover:border-[#356B8C] rounded-xl text-[#183B56] transition-all shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#183B56]">Officer Davis</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-mono font-semibold">
                      DSP-104
                    </span>
                  </div>
                  <div className="text-[10px] text-[#697586] mt-0.5">Central Emergency Dispatcher</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('ADM-001', 'admin', 'dispatcher')}
                  className="p-3 text-left bg-[#F7F8FA] hover:bg-[#EEF2F6] border border-[#E4E9EF] hover:border-purple-300 rounded-xl text-[#183B56] transition-all shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#183B56]">Cmdr. Jenkins</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded font-mono font-semibold">
                      ADM-001
                    </span>
                  </div>
                  <div className="text-[10px] text-[#697586] mt-0.5">Municipal Operations Admin</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('FC-402', 'crew', 'field_crew')}
                  className="p-3 text-left bg-[#F7F8FA] hover:bg-[#EEF2F6] border border-[#E4E9EF] hover:border-amber-300 rounded-xl text-[#183B56] transition-all shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#183B56]">Alex Rivera</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded font-mono font-semibold">
                      FC-402
                    </span>
                  </div>
                  <div className="text-[10px] text-[#697586] mt-0.5">Rapid Electrical Response Unit</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('FC-209', 'crew', 'field_crew')}
                  className="p-3 text-left bg-[#F7F8FA] hover:bg-[#EEF2F6] border border-[#E4E9EF] hover:border-emerald-300 rounded-xl text-[#183B56] transition-all shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#183B56]">Maya Chen</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-mono font-semibold">
                      FC-209
                    </span>
                  </div>
                  <div className="text-[10px] text-[#697586] mt-0.5">Roadway Safety & Structural Tech</div>
                </button>
              </div>

              <p className="text-[10px] text-[#697586] text-center mt-3">
                Click any profile above to instantly populate credentials and test the role boundary.
              </p>
            </div>

          </div>

        </div>

        {/* Security Compliance Footer */}
        <div className="bg-[#F7F8FA] border-t border-[#E4E9EF] px-6 py-3.5 text-center text-[11px] text-[#697586] flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#20A39E]" />
            <span>CivicShield Audit Enforcement Active • All IP logins timestamped</span>
          </div>
          <span>Public Works Emergency Telecommunications Bureau</span>
        </div>

      </div>
    </div>
  );
}
