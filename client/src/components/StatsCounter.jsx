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
      iconBg: 'bg-[#F0F6FA] text-[#356B8C] border-[#D0E1ED]',
      accentBorder: 'hover:border-[#CBD5E1]',
      activeBorder: 'border-l-4 border-l-[#20A39E] border-[#20A39E] bg-[#F0FDFC]',
      textColor: 'text-[#183B56]',
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
      iconBg: 'bg-[#FDF2F2] text-[#D64545] border-[#F8B4B4]',
      accentBorder: 'hover:border-[#F8B4B4]',
      activeBorder: 'border-l-4 border-l-[#D64545] border-[#F8B4B4] bg-[#FDF2F2]',
      textColor: 'text-[#D64545]',
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
      iconBg: 'bg-[#FEF9EE] text-[#D99A26] border-[#F9DE9E]',
      accentBorder: 'hover:border-[#F9DE9E]',
      activeBorder: 'border-l-4 border-l-[#D99A26] border-[#F9DE9E] bg-[#FEF9EE]',
      textColor: 'text-[#D99A26]',
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
      iconBg: 'bg-[#F0FDF4] text-[#25855A] border-[#BCF0DA]',
      accentBorder: 'hover:border-[#BCF0DA]',
      activeBorder: 'border-l-4 border-l-[#25855A] border-[#BCF0DA] bg-[#F0FDF4]',
      textColor: 'text-[#25855A]',
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              onClick={card.onClick}
              className={`p-4 sm:p-5 rounded-xl border transition-all cursor-pointer select-none group shadow-card hover:shadow-card-hover ${
                card.isActive
                  ? `${card.activeBorder}`
                  : `bg-white border-[#E4E9EF] ${card.accentBorder} hover:bg-[#FDFEFE]`
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-[#697586]">
                    {card.title}
                  </span>

                  <div className="mt-1.5 flex items-baseline space-x-1.5">
                    <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${card.textColor} tabular-nums`}>
                      {loading ? (
                        <span className="inline-block w-8 h-7 bg-[#E4E9EF] animate-pulse rounded-md"></span>
                      ) : (
                        card.value
                      )}
                    </span>
                    <span className="text-xs text-[#697586] font-medium">cases</span>
                  </div>

                  <p className="mt-1 text-xs text-[#697586]">
                    {card.subtext}
                  </p>
                </div>

                <div className={`p-2.5 rounded-lg border shadow-xs ${card.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              {/* Status Pill & Filter Affordance */}
              <div className="mt-3.5 pt-2.5 border-t border-[#E4E9EF] flex items-center justify-between text-[11px]">
                <span className="text-[#697586] font-medium">
                  {card.badgeText}
                </span>
                <span className="text-[#356B8C] font-semibold flex items-center space-x-0.5 group-hover:text-[#20A39E] transition-colors">
                  <span>{card.isActive ? 'Active Filter' : 'Filter by'}</span>
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Quick Filter Chips */}
      {stats?.categoryCounts && (
        <div className="bg-white border border-[#E4E9EF] rounded-xl p-3 shadow-card">
          <div className="flex items-center space-x-2 overflow-x-auto text-xs pb-0.5 scrollbar-thin">
            <span className="text-[#697586] font-semibold whitespace-nowrap pl-1 text-[11px] uppercase tracking-wider flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-[#356B8C]" />
              <span>Category:</span>
            </span>

            <button
              onClick={() => onCategorySelect('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shadow-xs ${
                !selectedCategory
                  ? 'bg-[#183B56] text-white shadow-sm'
                  : 'bg-[#F7F8FA] hover:bg-[#F0F4F8] text-[#183B56] border border-[#E4E9EF]'
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center space-x-1.5 transition-all shadow-xs ${
                    isSelected
                      ? 'bg-[#20A39E] text-white font-semibold shadow-sm'
                      : 'bg-[#F7F8FA] hover:bg-[#F0F4F8] text-[#172B3A] border border-[#E4E9EF]'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold tabular-nums ${
                    isSelected ? 'bg-[#177e7a] text-white' : 'bg-[#E4E9EF] text-[#183B56]'
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
