import React, { useState } from 'react';
import { 
  AlertTriangle, 
  MapPin, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  Zap, 
  Droplets, 
  Construction, 
  Lightbulb, 
  HelpCircle, 
  Image as ImageIcon, 
  ThumbsUp, 
  Copy, 
  Check, 
  Navigation 
} from 'lucide-react';
import { soundFx } from '../services/soundFx.js';

// Category icon mapper
export function getCategoryIcon(category) {
  switch (category) {
    case 'Fallen Electrical Cable':
      return Zap;
    case 'Burst Water Main':
      return Droplets;
    case 'Open Sewer Manhole':
      return AlertTriangle;
    case 'Damaged Road':
      return Construction;
    case 'Streetlight Failure':
      return Lightbulb;
    default:
      return HelpCircle;
  }
}

// Relative time formatter helper
export function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffMinutes = Math.floor((now - date) / (1000 * 60));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

// Restrained, accessible status badges
export function getStatusStyle(status) {
  switch (status) {
    case 'Submitted':
      return 'bg-slate-800 text-slate-300 border-slate-700';
    case 'Acknowledged':
      return 'bg-blue-950/80 text-blue-300 border-blue-800';
    case 'Dispatched':
      return 'bg-sky-950/80 text-sky-300 border-sky-800';
    case 'On Site':
      return 'bg-amber-950/80 text-amber-300 border-amber-800';
    case 'Resolved':
      return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
    case 'Rejected':
      return 'bg-rose-950/80 text-rose-300 border-rose-800';
    default:
      return 'bg-slate-800 text-slate-400 border-slate-700';
  }
}

// Restrained urgency styles
export function getUrgencyStyle(urgency) {
  switch (urgency) {
    case 'Critical':
      return 'bg-red-950/80 text-red-300 border border-red-800 font-semibold';
    case 'Medium':
      return 'bg-amber-950/80 text-amber-300 border border-amber-800 font-semibold';
    case 'Low':
      return 'bg-slate-800 text-slate-300 border border-slate-700';
    default:
      return 'bg-slate-800 text-slate-400 border border-slate-700';
  }
}

const STAGES = ['Submitted', 'Acknowledged', 'Dispatched', 'On Site', 'Resolved'];

export default function IncidentCard({ incident, onSelect, onFlyToLocation }) {
  const CategoryIcon = getCategoryIcon(incident.category);

  // Local storage confirmation / verify counter
  const upvoteKey = `civicshield_verified_${incident.id || incident.reference_id}`;
  const [hasConfirmed, setHasConfirmed] = useState(() => {
    return localStorage.getItem(upvoteKey) === 'true';
  });
  const [confirmCount, setConfirmCount] = useState(() => {
    const base = parseInt(incident.reference_id?.replace(/\D/g, '').slice(-1) || '3', 10);
    return Math.max(2, base) + (localStorage.getItem(upvoteKey) === 'true' ? 1 : 0);
  });
  const [copied, setCopied] = useState(false);

  const handleConfirm = (e) => {
    e.stopPropagation();
    soundFx.playSuccess();
    const nextState = !hasConfirmed;
    setHasConfirmed(nextState);
    setConfirmCount(prev => nextState ? prev + 1 : prev - 1);
    localStorage.setItem(upvoteKey, nextState ? 'true' : 'false');
  };

  const handleCopyRef = (e) => {
    e.stopPropagation();
    soundFx.playClick();
    if (incident.reference_id) {
      navigator.clipboard.writeText(incident.reference_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentStageIndex = STAGES.indexOf(incident.status);

  // Left accent border based on urgency
  const leftBorderColor = 
    incident.urgency === 'Critical' ? 'border-l-4 border-l-red-500' :
    incident.urgency === 'Medium' ? 'border-l-4 border-l-amber-500' :
    'border-l-4 border-l-slate-600';

  return (
    <article 
      onClick={() => {
        soundFx.playClick();
        onSelect(incident);
      }}
      className={`bg-[#111726] rounded-lg border border-[#1e293b] hover:border-[#334155] ${leftBorderColor} transition-colors cursor-pointer flex flex-col justify-between overflow-hidden group`}
    >
      <div className="p-4 sm:p-5 space-y-3 flex-1">
        
        {/* Header Bar: Ref ID, Status & Urgency */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyRef}
              title="Click to copy tracking reference code"
              className="font-mono text-xs font-semibold text-slate-300 bg-[#162032] border border-[#22314a] px-2 py-0.5 rounded hover:bg-[#1d2b42] transition-colors flex items-center space-x-1"
            >
              <span>{incident.reference_id}</span>
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
            </button>
            {incident.is_demo && (
              <span className="text-[10px] font-medium text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700">
                Demo
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1.5">
            <span className={`text-[10px] px-2 py-0.5 rounded border ${getStatusStyle(incident.status)}`}>
              {incident.status}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded ${getUrgencyStyle(incident.urgency)}`}>
              {incident.urgency}
            </span>
          </div>
        </div>

        {/* Hazard Title */}
        <h3 className="font-semibold text-sm sm:text-base text-slate-100 group-hover:text-sky-300 transition-colors line-clamp-2 leading-snug">
          {incident.title}
        </h3>

        {/* Location & Sector */}
        <div className="flex items-center space-x-1.5 text-xs text-slate-400">
          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="truncate">
            <strong className="text-slate-300 font-medium">{incident.landmark}</strong>
            <span className="text-slate-500"> • {incident.area}</span>
          </span>
        </div>

        {/* Description snippet */}
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {incident.description}
        </p>

        {/* Photo Thumbnail if attached */}
        {incident.photo_url && (
          <div className="relative h-28 w-full rounded-md overflow-hidden border border-[#1e293b] bg-slate-950">
            <img 
              src={incident.photo_url} 
              alt={incident.title} 
              className="w-full h-full object-cover group-hover:opacity-95 transition-opacity"
            />
            <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur-xs text-[10px] text-slate-300 font-medium flex items-center space-x-1 border border-slate-800">
              <ImageIcon className="w-3 h-3 text-sky-400" />
              <span>Citizen Photo Evidence</span>
            </div>
          </div>
        )}

        {/* Dispatch Pipeline Stepper */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
            <span>DISPATCH STATUS</span>
            <span className="text-slate-300 font-medium">{incident.status}</span>
          </div>
          <div className="grid grid-cols-5 gap-1 h-1">
            {STAGES.map((st, idx) => {
              const isPast = currentStageIndex >= idx;
              const isCurrent = currentStageIndex === idx;
              return (
                <div 
                  key={st}
                  title={`Stage: ${st}`}
                  className={`rounded-xs transition-colors ${
                    isCurrent ? 'bg-sky-400' :
                    isPast ? 'bg-sky-700' :
                    'bg-[#1e293b]'
                  }`}
                />
              );
            })}
          </div>
        </div>

      </div>

      {/* Card Footer */}
      <div className="px-4 sm:px-5 py-2.5 bg-[#0d131f] border-t border-[#1e293b] flex items-center justify-between text-xs text-slate-400">
        
        {/* Verification & Map Locators */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleConfirm}
            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center space-x-1.5 transition-colors ${
              hasConfirmed
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                : 'bg-[#162032] hover:bg-[#1f2d47] text-slate-300 border border-[#22314a]'
            }`}
            title="Confirm this hazard is still active on site"
          >
            <ThumbsUp className={`w-3 h-3 ${hasConfirmed ? 'text-emerald-400 fill-emerald-400' : 'text-slate-400'}`} />
            <span>{hasConfirmed ? 'Verified' : 'Verify'}</span>
            <span className="ml-0.5 px-1 rounded text-[10px] bg-slate-900 text-slate-300 tabular-nums">
              {confirmCount}
            </span>
          </button>

          {incident.latitude != null && incident.longitude != null && !isNaN(Number(incident.latitude)) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                soundFx.playClick();
                if (onFlyToLocation) onFlyToLocation(incident);
              }}
              className="p-1.5 rounded bg-[#162032] hover:bg-[#1f2d47] text-slate-400 hover:text-sky-300 border border-[#22314a] transition-colors"
              title="Locate coordinates on geospatial map"
              aria-label="Locate hazard on map"
            >
              <Navigation className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Time and Details link */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-slate-500 hidden sm:flex text-[11px]">
            <Clock className="w-3 h-3" />
            <span>{formatTimeAgo(incident.created_at)}</span>
          </div>

          <div className="flex items-center space-x-0.5 font-medium text-sky-400 group-hover:text-sky-300 text-xs">
            <span>Inspect</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

      </div>
    </article>
  );
}
