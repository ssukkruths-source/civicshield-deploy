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
      return 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0] font-medium';
    case 'Acknowledged':
      return 'bg-[#F0F6FA] text-[#1E4869] border-[#D0E1ED] font-medium';
    case 'Dispatched':
      return 'bg-[#E6F7F6] text-[#156965] border-[#BCE8E6] font-medium';
    case 'On Site':
      return 'bg-[#FEF9EE] text-[#B45309] border-[#F9DE9E] font-medium';
    case 'Resolved':
      return 'bg-[#F0FDF4] text-[#166534] border-[#BCF0DA] font-semibold';
    case 'Rejected':
      return 'bg-[#FDF2F2] text-[#991B1B] border-[#F8B4B4] font-medium';
    default:
      return 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0] font-medium';
  }
}

// Restrained urgency styles
export function getUrgencyStyle(urgency) {
  switch (urgency) {
    case 'Critical':
      return 'bg-[#FDF2F2] text-[#D64545] border border-[#F8B4B4] font-semibold';
    case 'Medium':
      return 'bg-[#FEF9EE] text-[#D99A26] border border-[#F9DE9E] font-semibold';
    case 'Low':
      return 'bg-[#F0F6FA] text-[#356B8C] border border-[#D0E1ED] font-medium';
    default:
      return 'bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]';
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

  // Subtle left border accent depending on urgency
  const leftBorderAccent = 
    incident.urgency === 'Critical' ? 'border-l-4 border-l-[#D64545]' :
    incident.urgency === 'Medium' ? 'border-l-4 border-l-[#D99A26]' :
    'border-l-4 border-l-[#356B8C]';

  return (
    <article 
      onClick={() => {
        soundFx.playClick();
        onSelect(incident);
      }}
      className={`bg-white rounded-xl border border-[#E4E9EF] hover:border-[#CBD5E1] ${leftBorderAccent} shadow-card hover:shadow-card-hover transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group`}
    >
      <div className="p-4 sm:p-5 space-y-3 flex-1">
        
        {/* Header Bar: Ref ID, Status & Urgency */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyRef}
              title="Click to copy tracking reference code"
              className="font-mono text-xs font-semibold text-[#183B56] bg-[#F7F8FA] hover:bg-[#F0F4F8] border border-[#E4E9EF] px-2 py-0.5 rounded-md transition-colors flex items-center space-x-1"
            >
              <span>{incident.reference_id}</span>
              {copied ? <Check className="w-3 h-3 text-[#25855A]" /> : <Copy className="w-3 h-3 text-[#94A3B8]" />}
            </button>
            {incident.is_demo && (
              <span className="text-[10px] font-medium text-[#697586] bg-[#F1F5F9] px-1.5 py-0.5 rounded border border-[#E2E8F0]">
                Demo
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1.5">
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getStatusStyle(incident.status)}`}>
              {incident.status}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${getUrgencyStyle(incident.urgency)}`}>
              {incident.urgency}
            </span>
          </div>
        </div>

        {/* Hazard Title */}
        <h3 className="font-semibold text-sm sm:text-base text-[#183B56] group-hover:text-[#20A39E] transition-colors line-clamp-2 leading-snug">
          {incident.title}
        </h3>

        {/* Location & Sector */}
        <div className="flex items-center space-x-1.5 text-xs text-[#697586]">
          <MapPin className="w-3.5 h-3.5 text-[#356B8C] shrink-0" />
          <span className="truncate">
            <strong className="text-[#172B3A] font-medium">{incident.landmark}</strong>
            <span className="text-[#697586]"> • {incident.area}</span>
          </span>
        </div>

        {/* Description snippet */}
        <p className="text-xs text-[#697586] line-clamp-2 leading-relaxed">
          {incident.description}
        </p>

        {/* Photo Thumbnail if attached */}
        {incident.photo_url && (
          <div className="relative h-28 w-full rounded-lg overflow-hidden border border-[#E4E9EF] bg-[#F1F5F9]">
            <img 
              src={incident.photo_url} 
              alt={incident.title} 
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
            />
            <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-white/90 backdrop-blur-xs text-[10px] text-[#183B56] font-medium flex items-center space-x-1 border border-[#E4E9EF] shadow-xs">
              <ImageIcon className="w-3 h-3 text-[#20A39E]" />
              <span>Citizen Photo Evidence</span>
            </div>
          </div>
        )}

        {/* Dispatch Pipeline Stepper */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-[10px] text-[#697586] mb-1 font-medium">
            <span className="uppercase tracking-wider">Progress</span>
            <span className="text-[#183B56] font-semibold">{incident.status}</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5 h-1.5">
            {STAGES.map((st, idx) => {
              const isPast = currentStageIndex >= idx;
              const isCurrent = currentStageIndex === idx;
              return (
                <div 
                  key={st}
                  title={`Stage: ${st}`}
                  className={`rounded-full transition-all duration-300 ${
                    isCurrent ? 'bg-[#20A39E]' :
                    isPast ? 'bg-[#356B8C]' :
                    'bg-[#E4E9EF]'
                  }`}
                />
              );
            })}
          </div>
        </div>

      </div>

      {/* Card Footer */}
      <div className="px-4 sm:px-5 py-3 bg-[#F7F8FA] border-t border-[#E4E9EF] flex items-center justify-between text-xs text-[#697586]">
        
        {/* Verification & Map Locators */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleConfirm}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all shadow-xs ${
              hasConfirmed
                ? 'bg-[#F0FDF4] text-[#166534] border border-[#BCF0DA]'
                : 'bg-white hover:bg-[#F0F4F8] text-[#172B3A] border border-[#E4E9EF]'
            }`}
            title="Confirm this hazard is still active on site"
          >
            <ThumbsUp className={`w-3 h-3 ${hasConfirmed ? 'text-[#25855A] fill-[#25855A]' : 'text-[#697586]'}`} />
            <span>{hasConfirmed ? 'Confirmed' : 'Confirm'}</span>
            <span className="ml-0.5 px-1 rounded text-[10px] bg-[#E4E9EF] text-[#183B56] font-semibold tabular-nums">
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
              className="p-1.5 rounded-lg bg-white hover:bg-[#F0F4F8] text-[#697586] hover:text-[#20A39E] border border-[#E4E9EF] transition-colors shadow-xs"
              title="Locate coordinates on geospatial map"
              aria-label="Locate hazard on map"
            >
              <Navigation className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Time and Details link */}
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-1 text-[#697586] hidden sm:flex text-[11px]">
            <Clock className="w-3 h-3 text-[#94A3B8]" />
            <span>{formatTimeAgo(incident.created_at)}</span>
          </div>

          <div className="flex items-center space-x-0.5 font-semibold text-[#20A39E] group-hover:text-[#177e7a] text-xs">
            <span>Details</span>
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>

      </div>
    </article>
  );
}
