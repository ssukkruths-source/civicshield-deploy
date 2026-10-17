import React from 'react';
import { Send, SearchCheck, Radio, CheckCircle, Shield, ArrowRight } from 'lucide-react';

export default function HowItWorks({ onOpenReport }) {
  const steps = [
    {
      num: '01',
      title: 'Report Incident',
      desc: 'Submit location landmark, sector, hazard category, urgency, and photo via the public portal or GPS.',
      icon: Send,
      color: 'bg-teal-500'
    },
    {
      num: '02',
      title: 'Duplicate Triage',
      desc: 'System cross-checks reports within 24 hours to prevent duplicate tickets and clusters related outages.',
      icon: SearchCheck,
      color: 'bg-blue-600'
    },
    {
      num: '03',
      title: 'Crew Mobilization',
      desc: 'Authorized dispatchers acknowledge priority and deploy specialized field units with GPS routing.',
      icon: Radio,
      color: 'bg-purple-600'
    },
    {
      num: '04',
      title: 'Verified Resolution',
      desc: 'Field teams log on-site inspection, repair public utility infrastructure, and post verified resolution notes.',
      icon: CheckCircle,
      color: 'bg-emerald-600'
    }
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200">
          Transparent Municipal Operations
        </span>
        <h2 className="text-xl sm:text-2xl font-bold brand-font text-slate-900 mt-2">
          How CivicShield Dispatches & Resolves Emergencies
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Every citizen report directly feeds the municipal rapid-response engine with complete audit transparency.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={idx} className="relative group text-center md:text-left flex flex-col items-center md:items-start">
              <div className="flex items-center space-x-3 mb-3">
                <div className={`w-10 h-10 rounded-2xl ${step.color} text-white flex items-center justify-center shadow-md font-bold text-sm`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-mono text-xs font-bold text-slate-400">
                  STEP {step.num}
                </span>
              </div>

              <h3 className="font-bold text-sm text-slate-900 brand-font mb-1">
                {step.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {step.desc}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-teal-600" />
          <span>Municipal Service Level Agreement: High-risk electrical & water incidents dispatched within 60 minutes.</span>
        </div>
        <button
          onClick={onOpenReport}
          className="font-semibold text-teal-600 hover:text-teal-700 flex items-center space-x-1"
        >
          <span>File a Hazard Report</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
