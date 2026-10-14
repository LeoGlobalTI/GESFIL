import React, { useEffect, useState, useMemo } from 'react';
import { Ticket, Station, TicketStatus, Service } from '@/types';
import { playNotificationSound, initAudio } from '@/lib/audio';
import { CORPORATE_INFO } from '@/constants';

/**
 * Propiedades del componente PublicDisplayView.
 */
interface PublicDisplayViewProps {
  tickets: Ticket[];
  stations: Station[];
  services: Service[];
  displaySettings?: { notificationSound: string; notificationVolume?: number; notificationDuration?: number };
}

/**
 * Componente principal de la pantalla pública.
 * Muestra los llamados activos y la lista de espera.
 */
const PublicDisplayView: React.FC<PublicDisplayViewProps> = ({ tickets, stations, services, displaySettings }) => {
  const [now, setNow] = useState(new Date());
  const [lastCalledTicketId, setLastCalledTicketId] = useState<string | null>(null);
  const [lastRecalledCount, setLastRecalledCount] = useState<number>(0);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [showDock, setShowDock] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  // Auto-desbloqueo de audio al primer clic o toque en cualquier parte de la pantalla
  useEffect(() => {
    const handleFirstInteraction = () => {
      initAudio();
      setAudioUnlocked(true);
    };

    window.addEventListener('click', handleFirstInteraction, { once: true });
    window.addEventListener('touchstart', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  // Efecto para activar modo administrador oculto al pulsar 5 veces
  useEffect(() => {
    if (clickCount >= 5) {
      setShowDock(true);
      const timer = setTimeout(() => {
        setShowDock(false);
        setClickCount(0);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [clickCount]);

  const dockStyle = (
    <style>{`
      .dock-nav {
        opacity: ${showDock ? '1' : '0'};
        pointer-events: ${showDock ? 'auto' : 'none'};
        transition: opacity 0.3s ease;
      }
    `}</style>
  );

  // Efecto para actualizar el reloj cada segundo
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    
    // Keep-alive: Previene que la pantalla se apague por inactividad
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
          console.log('Wake Lock activo');
        }
      } catch (err: any) {
        if (err?.name !== 'NotAllowedError' && err?.name !== 'SecurityError') {
          console.warn('Wake Lock no disponible:', err?.message);
        }
      }
    };

    requestWakeLock();

    // Fallback: ping periódico para mantener la pestaña activa
    const keepAlive = setInterval(() => console.log('Ping de Keep-alive del Display'), 30000);

    const handleVisibilityChange = () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(timer);
      clearInterval(keepAlive);
      if (wakeLock) wakeLock.release();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Filtra y ordena los tickets que están siendo llamados o atendidos actualmente
  const activeCalls = useMemo(() => 
    tickets
      .filter(t => t.status === TicketStatus.CALLING || t.status === TicketStatus.ATTENDING)
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === TicketStatus.CALLING ? -1 : 1;
        return (b.calledAt || 0) - (a.calledAt || 0);
      })
      .slice(0, 5),
  [tickets]);

  // Efecto para reproducir sonido de notificación cuando hay un nuevo llamado
  useEffect(() => {
    const currentCalling = activeCalls.find(t => t.status === TicketStatus.CALLING);
    if (currentCalling) {
      const currentRecalledCount = currentCalling.metadata?.recalledCount || 0;
      
      if (currentCalling.id !== lastCalledTicketId || currentRecalledCount > lastRecalledCount) {
        setLastCalledTicketId(currentCalling.id);
        setLastRecalledCount(currentRecalledCount);
        playNotificationSound(
          displaySettings?.notificationSound || 'timbre',
          displaySettings?.notificationVolume ?? 1,
          displaySettings?.notificationDuration ?? 1
        );
      }
    }
  }, [activeCalls, lastCalledTicketId, lastRecalledCount, displaySettings?.notificationSound, displaySettings?.notificationVolume, displaySettings?.notificationDuration]);

  // Filtra y ordena los tickets en espera (Prioridad primero, luego cronológico)
  const waitingList = useMemo(() => 
    tickets
      .filter(t => t.status === TicketStatus.WAITING)
      .sort((a, b) => {
        const aPriority = a.metadata?.priority ? 1 : 0;
        const bPriority = b.metadata?.priority ? 1 : 0;
        if (aPriority !== bPriority) return bPriority - aPriority;
        return a.createdAt - b.createdAt;
      })
      .slice(0, 10),
  [tickets]);

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 md:p-12 font-sans flex flex-col overflow-hidden selection:bg-indigo-500">
      {!audioUnlocked && (
        <div className="bg-indigo-600/90 backdrop-blur-md text-white px-6 py-4 rounded-3xl flex flex-col sm:flex-row items-center justify-between shadow-2xl mb-6 gap-4 border border-indigo-400/30 animate-pulse">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <span className="text-2xl">🔊</span>
            <div>
              <p className="text-xs font-black uppercase tracking-wider">Habilitar Alertas de Audio en Sala</p>
              <p className="text-[10px] text-indigo-200">Requerido por el navegador para reproducir llamados de voz y timbre.</p>
            </div>
          </div>
          <button 
            onClick={() => {
              playNotificationSound(displaySettings?.notificationSound || 'timbre', 1, 0.5);
              setAudioUnlocked(true);
            }}
            className="px-6 py-2.5 bg-white text-indigo-900 text-xs font-black rounded-2xl hover:bg-slate-100 transition-all uppercase tracking-widest shadow-lg flex-shrink-0"
          >
            Activar Audio
          </button>
        </div>
      )}
      <header className="flex flex-col md:flex-row justify-between items-center mb-10 md:mb-16 animate-fade-in gap-6">
        <div className="flex items-center gap-4 md:gap-8">
          <div 
            onClick={() => setClickCount(prev => prev + 1)}
            title="Pantalla Pública (5 clics para mostrar controles)"
            className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-950 cursor-pointer select-none active:scale-95 transition-transform"
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="md:w-8 md:h-8"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl md:text-4xl font-black tracking-tight leading-none text-white">{CORPORATE_INFO.name}<span className="text-indigo-500">.</span></h1>
              <span className="px-2.5 py-0.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[9px] font-black uppercase tracking-widest rounded-full">{CORPORATE_INFO.company} &bull; {CORPORATE_INFO.domain}</span>
              <span className="hidden sm:inline-block px-2.5 py-0.5 bg-white/5 border border-white/10 text-slate-300 text-[9px] font-black uppercase tracking-widest rounded-full">{CORPORATE_INFO.version}</span>
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-[8px] md:text-[10px]">{CORPORATE_INFO.systemName} &bull; Display Center</p>
          </div>
        </div>
        
        <div className="flex flex-col items-center md:items-end">
          <div className="text-4xl md:text-6xl font-extrabold tracking-tighter leading-none tabular-nums text-indigo-50">
            {now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false })}
            <span className="text-xl md:text-2xl ml-2 opacity-30">{now.toLocaleTimeString('es-CL', { second: '2-digit', hour12: false })}</span>
          </div>
          <div className="text-[10px] md:text-sm font-bold text-slate-500 mt-2 uppercase tracking-[0.2em]">
            {now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
      </header>

      {/* Cuerpo principal: Llamados activos y lista de espera */}
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center gap-4 px-4 mb-4">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
            <h2 className="text-sm font-black text-slate-500 uppercase tracking-[0.5em]">Llamados Activos</h2>
          </div>
          
          {/* Lista de llamados activos */}
          <div className="grid grid-cols-1 gap-6">
            {activeCalls.map((ticket, idx) => {
              const station = stations.find(s => s.id === ticket.stationId);
              const service = services.find(s => s.id === ticket.serviceId);
              const isCalling = ticket.status === TicketStatus.CALLING;

              return (
                <div 
                  key={ticket.id}
                  className={`flex flex-col sm:flex-row items-center justify-between p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] border transition-all duration-700 animate-fade-in gap-6 ${
                    isCalling 
                    ? "scale-[1.02] shadow-[0_0_80px_-10px_rgba(79,70,229,0.5)]" 
                    : "bg-slate-900/40 border-slate-800/50"
                  }`}
                  style={{ 
                    animationDelay: `${idx * 0.15}s`,
                    backgroundColor: isCalling ? (service?.color || '#4f46e5') : undefined,
                    borderColor: isCalling ? 'rgba(255,255,255,0.2)' : undefined
                  }}
                >
                  <div className="flex flex-col items-center sm:items-start">
                    <span className={`text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] mb-2 ${isCalling ? 'text-white/70' : 'text-slate-500'}`}>Paciente</span>
                    <span className={`text-6xl md:text-8xl lg:text-[100px] font-black leading-none tracking-tighter ${isCalling ? 'animate-pulse-fast' : ''}`}>{ticket.code}</span>
                  </div>
                  
                  <div className="hidden sm:block h-16 md:h-24 w-[1px] bg-white/10"></div>
                  <div className="sm:hidden w-full h-[1px] bg-white/10"></div>
                  
                  <div className="text-center sm:text-right">
                    <span className={`text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] mb-2 ${isCalling ? 'text-white/70' : 'text-slate-500'}`}>Módulo</span>
                    <div className="flex items-baseline justify-center sm:justify-end gap-3">
                      <span className={`text-6xl md:text-8xl lg:text-[100px] font-black leading-none tracking-tighter ${isCalling ? 'animate-pulse-fast' : ''}`}>
                        {station?.name.split(' ').pop() || "00"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {activeCalls.length === 0 && (
              <div className="h-[400px] flex items-center justify-center border-2 border-dashed border-slate-800/60 rounded-[4rem]">
                <p className="text-3xl font-black uppercase tracking-widest text-slate-800 italic">Sincronizando flujo...</p>
              </div>
            )}
          </div>
        </div>

        {/* Lista de espera */}
        <div className="lg:col-span-4">
           <div className="bg-[#0f172a] rounded-[4rem] p-10 flex flex-col border border-slate-800/50 shadow-2xl h-full">
             <div className="flex items-center justify-between mb-10">
                <h3 className="text-xl font-bold tracking-tight text-white uppercase tracking-widest">En Espera</h3>
                <span className="bg-indigo-500 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-indigo-950">
                  Total: {tickets.filter(t => t.status === TicketStatus.WAITING).length}
                </span>
             </div>

             <div className="flex-grow space-y-3 mb-12 overflow-hidden">
               {waitingList.length > 0 ? (
                 waitingList.map((t, idx) => {
                   const service = services.find(s => s.id === t.serviceId);
                   return (
                     <div key={t.id} className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5 animate-fade-in" style={{ animationDelay: `${idx * 0.08}s` }}>
                        <div className="flex items-center gap-4">
                          <div className="w-2 h-10 rounded-full" style={{ backgroundColor: service?.color || '#333' }}></div>
                          <span className="text-3xl font-bold tracking-tighter">{t.code}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{service?.name || '---'}</span>
                     </div>
                   );
                 })
               ) : (
                 <div className="h-full flex items-center justify-center opacity-10 italic text-slate-400">
                    Sin turnos pendientes
                 </div>
               )}
             </div>
           </div>
        </div>
      </main>

      {/* Pie de página */}
      <footer className="mt-12 bg-slate-900/30 py-6 md:py-4 px-6 md:px-10 rounded-3xl md:rounded-full border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
           <span className="text-[9px] md:text-[11px] font-black text-indigo-500 uppercase tracking-[0.4em]">{CORPORATE_INFO.systemName}</span>
           <div className="hidden md:block w-1 h-1 bg-slate-700 rounded-full"></div>
           <span className="text-[9px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Powered by <a href={CORPORATE_INFO.brandUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">{CORPORATE_INFO.company}</a> &bull; {CORPORATE_INFO.domain}</span>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          {services.slice(0, 4).map(s => (
            <div key={s.id} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{s.name}</span>
            </div>
          ))}
        </div>
      </footer>

      <style>{`
        @keyframes pulse-fast {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .animate-pulse-fast {
          animation: pulse-fast 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
      {dockStyle}
    </div>
  );
};

export default PublicDisplayView;