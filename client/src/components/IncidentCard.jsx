import React from 'react';
import { 
  AlertTriangle, 
  MapPin, 
  Calendar, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowUpRight,
  Flame,
  Zap,
  Droplets,
  Construction,
  Lightbulb,
  HelpCircle,
  ShieldAlert
} from 'lucide-react';

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

// Status styles
export function getStatusStyle(status) {
  switch (status) {
    case 'Submitted':
      return 'bg-slate-100 text-slate-800 border-slate-300';
    case 'Acknowledged':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'Dispatched':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'On Site':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'Resolved':
      return 'bg-teal-100 text-teal-800 border-teal-300';
    case 'Rejected':
      return 'bg-rose-100 text-rose-800 border-rose-300';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-300';
  }
}

// Urgency badge styles
export function getUrgencyStyle(urgency) {
  switch (urgency) {
    case 'Critical':
      return 'bg-rose-600 text-white font-bold animate-pulse';
    case 'Medium':
      return 'bg-amber-500 text-white font-medium';
    case 'Low':
      return 'bg-sky-500 text-white font-medium';
    default:
      return 'bg-slate-500 text-white';
  }
}

export default function IncidentCard({ incident, onSelect }) {
  const CategoryIcon = getCategoryIcon(incident.category);

  return (
    <div 
      onClick={() => onSelect(incident)}
      className="bg-white rounded-2xl border border-slate-200/90 hover:border-teal-500/50 shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group"
    >
      <div className="p-5">
        {/* Card Header: Reference ID, Status & Demo Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
              {incident.reference_id}
            </span>
            {incident.is_demo && (
              <span className="text-[10px] font-semibold tracking-wider uppercase bg-slate-200/80 text-slate-600 px-2 py-0.5 rounded">
                Demo
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1.5">
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getStatusStyle(incident.status)}`}>
              {incident.status}
            </span>
            <span className={`text-[11px] px-2.5 py-0.5 rounded-full ${getUrgencyStyle(incident.urgency)}`}>
              {incident.urgency}
            </span>
          </div>
        </div>

        {/* Hazard Title */}
        <h3 className="font-bold text-base text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-1 mb-1.5 brand-font">
          {incident.title}
        </h3>

        {/* Description snippet */}
        <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
          {incident.description}
        </p>

        {/* Category & Landmark Metadata */}
        <div className="space-y-1.5 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <div className="p-1 rounded bg-slate-100 text-teal-700">
              <CategoryIcon className="w-3.5 h-3.5" />
            </div>
            <span className="font-medium text-slate-700">{incident.category}</span>
          </div>

          <div className="flex items-center space-x-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              {incident.landmark} <span className="text-slate-400">({incident.area})</span>
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>{formatTimeAgo(incident.created_at)}</span>
        </div>

        <div className="flex items-center space-x-1 font-semibold text-teal-600 group-hover:translate-x-0.5 transition-transform">
          <span>View Progress</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}
