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
    <section aria-labelledby="how-it-works-title" className="bg-white rounded-2xl border border-[#E4E9EF] p-6 sm:p-8 shadow-card">
      <div className="max-w-2xl mb-6">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#20A39E]">
          Standard Operating Procedures
        </span>
        <h2 id="how-it-works-title" className="text-xl sm:text-2xl font-extrabold text-[#183B56] mt-1 tracking-tight">
          Municipal Emergency Dispatch & Resolution SLA
        </h2>
        <p className="text-xs sm:text-sm text-[#697586] mt-1.5 leading-relaxed">
          Every citizen report directly feeds the municipal rapid-response engine with complete audit transparency.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={idx} className="bg-[#F7F8FA] border border-[#E4E9EF] hover:border-[#CBD5E1] rounded-xl p-4 sm:p-5 flex flex-col justify-between transition-all hover:bg-white hover:shadow-card group">
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="w-9 h-9 rounded-lg bg-white border border-[#E4E9EF] text-[#20A39E] flex items-center justify-center font-bold text-xs shadow-xs group-hover:bg-[#20A39E] group-hover:text-white transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-xs font-bold text-[#356B8C]">
                    PHASE {step.num}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-[#183B56] mb-1.5">
                  {step.title}
                </h3>
                <p className="text-xs text-[#697586] leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-[#E4E9EF] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#697586]">
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-[#20A39E] shrink-0" />
          <span>Service Level Guarantee: High-risk electrical & water incidents dispatched within 60 minutes.</span>
        </div>
        <button
          onClick={onOpenReport}
          className="font-semibold text-[#20A39E] hover:text-[#177e7a] flex items-center space-x-1 shrink-0 group transition-colors"
        >
          <span>File a Hazard Report</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </section>
  );
}
