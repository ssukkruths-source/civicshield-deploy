import React from 'react';
import { Shield, AlertTriangle, Clock, CheckCircle2, ChevronRight, Layers } from 'lucide-react';

export default function StatsCounter({ 
  stats, 
  loading, 
  onCategorySelect, 
  selectedCategory,
  onStatusFilter,
  selectedStatus,
  onUrgencyFilter,
  selectedUrgency
}) {
  const cards = [
    {
      id: 'total',
      title: 'Total Logged Cases',
      value: stats?.total ?? 0,
      icon: Shield,
      accentBorder: 'hover:border-slate-500',
      activeBorder: 'border-l-4 border-l-sky-500 border-sky-500/50 bg-[#162032]',
      textColor: 'text-white',
      badgeText: 'All Reports',
      subtext: 'Public & municipal registry',
      onClick: () => {
        if (onStatusFilter) onStatusFilter('');
        if (onUrgencyFilter) onUrgencyFilter('');
      },
      isActive: !selectedStatus && !selectedUrgency
    },
    {
      id: 'critical',
      title: 'Priority 1 Critical',
      value: stats?.critical ?? 0,
      icon: AlertTriangle,
      accentBorder: 'hover:border-red-500/50',
      activeBorder: 'border-l-4 border-l-red-500 border-red-500/50 bg-[#24141a]',
      textColor: 'text-red-400',
      badgeText: 'Immediate Danger',
      subtext: 'Life & property hazard',
      onClick: () => {
        if (onUrgencyFilter) onUrgencyFilter(selectedUrgency === 'Critical' ? '' : 'Critical');
      },
      isActive: selectedUrgency === 'Critical'
    },
    {
      id: 'dispatch',
      title: 'Crews Mobilized',
      value: stats?.inProgress ?? 0,
      icon: Clock,
      accentBorder: 'hover:border-amber-500/50',
      activeBorder: 'border-l-4 border-l-amber-500 border-amber-500/50 bg-[#241e14]',
      textColor: 'text-amber-400',
      badgeText: 'Active Triage',
      subtext: 'En route or work on-site',
      onClick: () => {
        if (onStatusFilter) onStatusFilter(selectedStatus === 'Dispatched' ? '' : 'Dispatched');
      },
      isActive: selectedStatus === 'Dispatched' || selectedStatus === 'On Site'
    },
    {
      id: 'resolved',
      title: 'Repaired & Verified',
      value: stats?.resolved ?? 0,
      icon: CheckCircle2,
      accentBorder: 'hover:border-emerald-500/50',
      activeBorder: 'border-l-4 border-l-emerald-500 border-emerald-500/50 bg-[#12221b]',
      textColor: 'text-emerald-400',
      badgeText: 'Closed Tickets',
      subtext: 'Public safety restored',
      onClick: () => {
        if (onStatusFilter) onStatusFilter(selectedStatus === 'Resolved' ? '' : 'Resolved');
      },
      isActive: selectedStatus === 'Resolved'
    }
  ];

  return (
    <div className="space-y-3">
      {/* 4 Clean Institutional KPI Telemetry Panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              onClick={card.onClick}
              className={`p-4 rounded-lg border transition-all cursor-pointer select-none ${
                card.isActive
                  ? `${card.activeBorder} shadow-sm`
                  : `bg-[#111726] border-[#1e293b] ${card.accentBorder} hover:bg-[#151e31]`
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-medium tracking-wide uppercase text-slate-400">
                    {card.title}
                  </span>

                  <div className="mt-1.5 flex items-baseline space-x-1.5">
                    <span className={`text-2xl sm:text-3xl font-bold tracking-tight ${card.textColor} tabular-nums`}>
                      {loading ? (
                        <span className="inline-block w-8 h-6 bg-slate-800 animate-pulse rounded"></span>
                      ) : (
                        card.value
                      )}
                    </span>
                    <span className="text-xs text-slate-500 font-normal">cases</span>
                  </div>

                  <p className="mt-1 text-xs text-slate-400">
                    {card.subtext}
                  </p>
                </div>

                <div className="p-2 rounded-md bg-[#182235] border border-[#26354d] text-slate-300">
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              {/* Status Pill & Filter Affordance */}
              <div className="mt-3 pt-2.5 border-t border-[#1e293b] flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">
                  {card.badgeText}
                </span>
                <span className="text-slate-400 group-hover:text-slate-200 font-medium flex items-center space-x-0.5">
                  <span>{card.isActive ? 'Active Filter' : 'Filter by'}</span>
                  <ChevronRight className="w-3 h-3 text-slate-500" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Pills Quick Filter Bar */}
      {stats?.categoryCounts && (
        <div className="bg-[#111726] border border-[#1e293b] rounded-lg p-2.5">
          <div className="flex items-center space-x-2 overflow-x-auto text-xs pb-0.5">
            <span className="text-slate-400 font-medium whitespace-nowrap pl-1 text-[11px] uppercase tracking-wider flex items-center space-x-1">
              <Layers className="w-3 h-3 text-slate-400" />
              <span>Category:</span>
            </span>

            <button
              onClick={() => onCategorySelect('')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                !selectedCategory
                  ? 'bg-sky-600 text-white font-semibold'
                  : 'bg-[#182235] text-slate-300 hover:bg-[#202d44]'
              }`}
            >
              All Categories
            </button>

            {Object.entries(stats.categoryCounts).map(([cat, count]) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => onCategorySelect(isSelected ? '' : cat)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap flex items-center space-x-1.5 transition-colors ${
                    isSelected
                      ? 'bg-sky-600 text-white font-semibold'
                      : 'bg-[#182235] text-slate-300 hover:bg-[#202d44]'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold tabular-nums ${
                    isSelected ? 'bg-sky-800 text-white' : 'bg-[#26354d] text-slate-300'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
