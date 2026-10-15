
import React, { useMemo } from 'react';
import { GesfilState, UserRole } from '@/types';

interface TechnicalInfoViewProps {
  state: GesfilState;
  isSidebar?: boolean;
  compact?: boolean;
}

const TechnicalInfoView: React.FC<TechnicalInfoViewProps> = ({ state, isSidebar = false, compact = false }) => {
  const technicalStats = useMemo(() => {
    const dataSize = JSON.stringify(state).length;
    const uptime = "99.99%";
    const totalUsers = state.users.length;
    const totalRequests = state.tickets.length;
    
    return {
      dataSize: (dataSize / 1024).toFixed(2) + " KB",
      uptime,
      totalUsers,
      totalRequests,
      apiLatency: "14ms",
      loadScore: Math.min(100, (totalRequests / 1000) * 100).toFixed(0)
    };
  }, [state]);

  if (compact) {
    return (
      <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 space-y-4">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Health Telemetry</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Core Load</span>
            <span className="text-sm font-black text-slate-900">{technicalStats.loadScore}%</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Bus Delay</span>
            <span className="text-sm font-black text-indigo-600">{technicalStats.apiLatency}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Storage</span>
            <span className="text-sm font-black text-slate-900">{technicalStats.dataSize.split(' ')[0]}K</span>
          </div>
        </div>
        <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${technicalStats.loadScore}%` }}></div>
        </div>
      </div>
    );
  }

  if (isSidebar) {
    return (
      <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-8 relative overflow-hidden group border border-white/5 shadow-2xl">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform pointer-events-none">
           <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </div>
        
        <div className="relative z-10">
           <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-6">Nodo Análisis</h3>
           <div className="space-y-4">
              <div className="flex justify-between items-baseline px-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Storage</span>
                <span className="text-sm font-black text-indigo-100">{technicalStats.dataSize}</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: '12%' }}></div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-3 relative z-10">
           <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center gap-1">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Load</p>
              <p className="text-sm font-black text-white">{technicalStats.loadScore}%</p>
           </div>
           <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center gap-1">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Latency</p>
              <p className="text-sm font-black text-indigo-400">{technicalStats.apiLatency}</p>
           </div>
        </div>

        <div className="pt-2 flex items-center justify-center gap-3 opacity-60">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]"></span>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Core Node Verified</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Carga de Datos', value: technicalStats.dataSize, icon: '📊', sub: 'Footprint Nodo' },
          { label: 'Uptime', value: technicalStats.uptime, icon: '⚡', sub: 'Disponibilidad' },
          { label: 'Latencia', value: technicalStats.apiLatency, icon: '🛰️', sub: 'Bus de Eventos' },
          { label: 'Load Score', value: `${technicalStats.loadScore}%`, icon: '📉', sub: 'Demanda' },
        ].map((item, idx) => (
          <div key={idx} className="group relative bg-white border border-slate-100 rounded-[2.5rem] p-8 hover:border-indigo-200 hover:shadow-2xl transition-all duration-500 overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -translate-y-12 translate-x-12 opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
             
             <div className="flex items-center gap-6 relative z-10">
                <div className="w-20 h-20 rounded-[1.75rem] flex items-center justify-center text-3xl font-black bg-slate-50 text-slate-900 shadow-2xl ring-4 ring-white">
                  {item.icon}
                </div>
                <div className="flex-grow min-w-0">
                   <h4 className="text-xl font-black text-slate-900 truncate pr-2 mb-1.5">{item.value}</h4>
                   <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600">
                     {item.label}
                   </span>
                </div>
             </div>

             <p className="text-xs text-slate-400 font-medium leading-relaxed mt-6">
               {item.sub}
             </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TechnicalInfoView;
