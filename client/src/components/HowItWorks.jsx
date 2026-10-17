import React from 'react';
import { Send, SearchCheck, Radio, CheckCircle, Shield, ArrowRight } from 'lucide-react';

export default function HowItWorks({ onOpenReport }) {
  const steps = [
    {
      num: '01',
      title: 'Citizen Incident Intake',
      desc: 'Submit location landmark, sector, hazard category, urgency rating, and photo evidence via the public portal or GPS.',
      icon: Send,
    },
    {
      num: '02',
      title: 'Automated Spatial Triage',
      desc: 'System cross-checks recent reports within 24 hours to prevent duplicate tickets and clusters related grid outages.',
      icon: SearchCheck,
    },
    {
      num: '03',
      title: 'Field Unit Mobilization',
      desc: 'Authorized municipal dispatchers acknowledge priority tickets and assign specialized utility crews with GPS routing.',
      icon: Radio,
    },
    {
      num: '04',
      title: 'Verified Restoration',
      desc: 'Field teams log on-site inspection, repair public infrastructure, and post verified resolution notes with completion proof.',
      icon: CheckCircle,
    }
  ];

  return (
    <section aria-labelledby="how-it-works-title" className="bg-[#111726] rounded-xl border border-[#1e293b] p-6 sm:p-8">
      <div className="max-w-2xl mb-6">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-400">
          Standard Operating Procedures
        </span>
        <h2 id="how-it-works-title" className="text-lg sm:text-xl font-bold text-white mt-1">
          Municipal Emergency Dispatch & Resolution SLA
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Every citizen report directly feeds the municipal rapid-response engine with complete audit transparency.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={idx} className="bg-[#0d131f] border border-[#1e293b] rounded-lg p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-md bg-[#162032] border border-[#22314a] text-sky-400 flex items-center justify-center font-bold text-xs">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-xs font-semibold text-slate-400">
                    PHASE {step.num}
                  </span>
                </div>

                <h3 className="font-semibold text-xs text-slate-200 mb-1.5">
                  {step.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-[#1e293b] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-sky-400 shrink-0" />
          <span>Service Level Guarantee: High-risk electrical & water incidents dispatched within 60 minutes.</span>
        </div>
        <button
          onClick={onOpenReport}
          className="font-medium text-sky-400 hover:text-sky-300 flex items-center space-x-1 shrink-0"
        >
          <span>File a Hazard Report</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </section>
  );
}
