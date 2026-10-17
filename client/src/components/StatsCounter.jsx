import React from 'react';
import { AlertTriangle, Clock, CheckCircle2, Shield, Activity, Flame } from 'lucide-react';

export default function StatsCounter({ stats, loading, onCategorySelect, selectedCategory }) {
  const cards = [
    {
      title: 'Total Hazards Logged',
      value: stats?.total ?? 0,
      icon: Shield,
      color: 'blue',
      borderColor: 'border-blue-500/20',
      bgColor: 'bg-blue-50/60',
      iconBg: 'bg-blue-600',
      textColor: 'text-blue-900',
      subtext: 'Public & municipal registry'
    },
    {
      title: 'Critical Emergency',
      value: stats?.critical ?? 0,
      icon: Flame,
      color: 'rose',
      borderColor: 'border-rose-500/20',
      bgColor: 'bg-rose-50/60',
      iconBg: 'bg-rose-600',
      textColor: 'text-rose-900',
      subtext: 'High hazard risk / Priority 1'
    },
    {
      title: 'In Dispatch / On-Site',
      value: stats?.inProgress ?? 0,
      icon: Clock,
      color: 'amber',
      borderColor: 'border-amber-500/20',
      bgColor: 'bg-amber-50/60',
      iconBg: 'bg-amber-600',
      textColor: 'text-amber-900',
      subtext: 'Field teams responding'
    },
    {
      title: 'Resolved & Restored',
      value: stats?.resolved ?? 0,
      icon: CheckCircle2,
      color: 'teal',
      borderColor: 'border-teal-500/20',
      bgColor: 'bg-teal-50/60',
      iconBg: 'bg-teal-600',
      textColor: 'text-teal-900',
      subtext: 'Work completed & verified'
    }
  ];

  return (
    <div className="space-y-4">
      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`p-4 sm:p-5 rounded-2xl bg-white border ${card.borderColor} shadow-sm hover:shadow-md transition-shadow relative overflow-hidden`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {card.title}
                  </p>
                  <div className="mt-2 flex items-baseline space-x-2">
                    <span className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${card.textColor} brand-font`}>
                      {loading ? (
                        <span className="inline-block w-8 h-8 bg-slate-200 animate-pulse rounded"></span>
                      ) : (
                        card.value
                      )}
                    </span>
                    <span className="text-xs font-medium text-slate-400">cases</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500 font-medium">
                    {card.subtext}
                  </p>
                </div>
                <div className={`p-2.5 rounded-xl ${card.iconBg} text-white shadow-sm`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Pills Quick Filter */}
      {stats?.categoryCounts && (
        <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs">
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-500 font-medium whitespace-nowrap pl-1">
              Filter Category:
            </span>
            <button
              onClick={() => onCategorySelect('')}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                !selectedCategory
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Categories
            </button>
            {Object.entries(stats.categoryCounts).map(([cat, count]) => (
              <button
                key={cat}
                onClick={() => onCategorySelect(selectedCategory === cat ? '' : cat)}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap flex items-center space-x-1.5 transition-colors ${
                  selectedCategory === cat
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{cat}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  selectedCategory === cat ? 'bg-teal-900 text-teal-100' : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
