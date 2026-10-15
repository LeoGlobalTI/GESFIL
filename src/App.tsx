
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useGesfilStore } from '@/state/useGesfilStore';
import { ICONS, CORPORATE_INFO } from '@/constants';
import { UserRole, User, Service, Station, GesfilState, Ticket, TicketStatus, Printer } from '@/types';
import ConfirmationModal from '@/components/ConfirmationModal';
import TotemView from '@/components/TotemView';
import StaffView from '@/components/StaffView';
import DashboardView from '@/components/DashboardView';
import TechnicalInfoView from '@/components/TechnicalInfoView';
import PublicDisplayView from '@/components/PublicDisplayView';
import LoginViewComponent from '@/components/LoginViewComponent';
import UserManagementView from '@/components/UserManagementView';
import ServiceManagementView from '@/components/ServiceManagementView';
import StationManagementView from '@/components/StationManagementView';
import PrinterManagementView from '@/components/PrinterManagementView';
import CorporateHeader from '@/components/CorporateHeader';
import VersionControlView from '@/components/VersionControlView';

const Nav: React.FC<{ role: UserRole, logout: () => void, currentUser: User }> = ({ role, logout, currentUser }) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  const canSee = (targetRole: UserRole[]) => targetRole.includes(role);

  return (
    <nav className="fixed bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 dock-nav text-white px-4 md:px-8 py-3 md:py-5 rounded-2xl md:rounded-[3rem] shadow-2xl z-50 flex items-center gap-4 md:gap-10 w-[90%] md:w-auto justify-center">
      <div className="flex items-center gap-4 pr-4 md:pr-8 border-r border-white/10 hidden sm:flex">
         <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-black text-indigo-400 text-base md:text-lg">
           {currentUser.name[0]}
         </div>
         <div className="hidden md:block">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] leading-none mb-1">{CORPORATE_INFO.name}</p>
            <p className="text-[13px] font-bold tracking-tight">{currentUser.username}</p>
         </div>
      </div>

      <div className="flex items-center gap-6 md:gap-8">
        {canSee([UserRole.TOTEM, UserRole.ADMIN, UserRole.SUPERADMIN]) && (
          <Link title="Totem" to="/totem" className={`flex flex-col items-center gap-1.5 transition-all group ${isActive('/totem') ? 'text-indigo-400 scale-110' : 'text-slate-500 hover:text-white'}`}>
            <ICONS.Terminal />
            <span className={`text-[9px] font-black uppercase tracking-widest transition-opacity ${isActive('/totem') ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>Totem</span>
          </Link>
        )}
        {canSee([UserRole.STAFF, UserRole.ADMIN, UserRole.SUPERADMIN]) && (
          <Link title="Módulo" to="/staff" className={`flex flex-col items-center gap-1.5 transition-all group ${isActive('/staff') ? 'text-indigo-400 scale-110' : 'text-slate-500 hover:text-white'}`}>
            <ICONS.Users />
            <span className={`text-[9px] font-black uppercase tracking-widest transition-opacity ${isActive('/staff') ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>Staff</span>
          </Link>
        )}
        {canSee([UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF, UserRole.TOTEM, UserRole.DISPLAY]) && (
          <Link title="Monitor" to="/display" className={`flex flex-col items-center gap-1.5 transition-all group ${isActive('/display') ? 'text-indigo-400 scale-110' : 'text-slate-500 hover:text-white'}`}>
            <ICONS.Screen />
            <span className={`text-[9px] font-black uppercase tracking-widest transition-opacity ${isActive('/display') ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>Live</span>
          </Link>
        )}
        {canSee([UserRole.ADMIN, UserRole.SUPERADMIN]) && (
          <Link title="Admin" to="/admin" className={`flex flex-col items-center gap-1.5 transition-all group ${isActive('/admin') ? 'text-indigo-400 scale-110' : 'text-slate-500 hover:text-white'}`}>
            <ICONS.Activity />
            <span className={`text-[9px] font-black uppercase tracking-widest transition-opacity ${isActive('/admin') ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>BI Hub</span>
          </Link>
        )}
      </div>
      
      <button 
        onClick={logout}
        className="w-11 h-11 rounded-[1.25rem] bg-rose-500/20 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all duration-300 shadow-xl shadow-rose-950/20"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      </button>
    </nav>
  );
};

const AdminPanel: React.FC<{ 
  state: GesfilState,
  reset: () => void, 
  seed: () => void,
  userRole: UserRole, 
  users: User[],
  onAddUser: (u: Omit<User, 'id'>) => void,
  onUpdateUser: (id: string, u: Partial<User>) => void,
  onDeleteUser: (id: string) => void,
  services: Service[],
  onAddService: (s: Omit<Service, 'id'>) => void,
  onUpdateService: (id: string, s: Partial<Service>) => void,
  onDeleteService: (id: string) => void,
  stations: Station[],
  onAddStation: (st: Omit<Station, 'id'>) => void,
  onUpdateStation: (id: string, st: Partial<Station>) => void,
  onDeleteStation: (id: string) => void,
  printers: Printer[],
  onAddPrinter: (p: Omit<Printer, 'id'>) => void,
  onUpdatePrinter: (id: string, p: Partial<Printer>) => void,
  onDeletePrinter: (id: string) => void,
  updateDisplaySettings: (settings: { notificationSound: string; notificationVolume?: number; notificationDuration?: number }) => void
}> = ({ state, reset, seed, userRole, users, onAddUser, onUpdateUser, onDeleteUser, services, onAddService, onUpdateService, onDeleteService, stations, onAddStation, onUpdateStation, onDeleteStation, printers, onAddPrinter, onUpdatePrinter, onDeletePrinter, updateDisplaySettings }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'services' | 'stations' | 'analytics' | 'printers' | 'settings' | 'versions'>('users');
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSeedModal, setShowSeedModal] = useState(false);

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-10 space-y-8 animate-fade-in pb-40">
      <ConfirmationModal 
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={reset}
        title="Purgar Sistema"
        message="¿Confirmar purga diaria? Esta acción eliminará todos los tickets y reiniciará los turnos a 0001."
      />
      <ConfirmationModal 
        isOpen={showSeedModal}
        onClose={() => setShowSeedModal(false)}
        onConfirm={() => {
          setShowSeedModal(false);
          seed();
        }}
        title="Inicializar Base de Datos"
        message="¿Está seguro de que desea inicializar la base de datos? Esta acción eliminará TODOS los datos actuales (tickets, módulos, servicios, usuarios excepto superadmin) y cargará los datos por defecto. Esta acción es irreversible."
      />
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Barra lateral de navegación */}
        <aside className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-3 shadow-xl shadow-slate-200/40 border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-5 py-4">Workspace</p>
            <div className="space-y-1.5">
              {[
                { id: 'users', label: 'Operadores', icon: <ICONS.Users />, count: users.length },
                { id: 'services', label: 'Servicios', icon: <ICONS.Activity />, count: services.length },
                { id: 'stations', label: 'Módulos', icon: <ICONS.Terminal />, count: stations.length },
                { id: 'printers', label: 'Impresoras', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>, count: printers.length },
                { id: 'settings', label: 'Configuración', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>, count: '' },
                { id: 'analytics', label: 'BI Hub', icon: <ICONS.Activity />, count: state.tickets.length },
                { 
                  id: 'versions', 
                  label: 'Versiones', 
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="6" y1="3" x2="6" y2="15"></line>
                      <circle cx="18" cy="6" r="3"></circle>
                      <circle cx="6" cy="18" r="3"></circle>
                      <path d="M18 9a9 9 0 0 1-9 9"></path>
                    </svg>
                  ), 
                  count: '' 
                },
              ].filter(tab => (tab.id !== 'printers' && tab.id !== 'settings') || userRole === UserRole.SUPERADMIN).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-[1.75rem] transition-all duration-300 group ${
                    activeTab === tab.id 
                    ? "bg-slate-900 text-white shadow-2xl -translate-y-1" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`transition-transform duration-300 ${activeTab === tab.id ? "text-indigo-400 scale-110" : "text-slate-300 group-hover:text-indigo-500"}`}>
                      {tab.icon}
                    </span>
                    <span className="text-xs font-black tracking-tight">{tab.label}</span>
                  </div>
                  {tab.count !== '' && tab.count !== undefined && (
                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-full transition-colors ${
                      activeTab === tab.id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group border border-white/5">
             <div className="relative z-10">
               <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4">Maintenance</h3>
               {userRole === UserRole.SUPERADMIN && (
                 <div className="space-y-3">
                   <button 
                     onClick={() => setShowResetModal(true)}
                     className="w-full py-4 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/20 font-black hover:bg-rose-500 hover:text-white transition-all duration-300 uppercase tracking-widest text-[9px]"
                   >
                     Purgar Sistema
                   </button>
                   <button 
                     onClick={() => setShowSeedModal(true)}
                     className="w-full py-4 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20 font-black hover:bg-indigo-500 hover:text-white transition-all duration-300 uppercase tracking-widest text-[9px]"
                   >
                     Inicializar DB
                   </button>
                 </div>
               )}
                <p className="text-[9px] text-slate-500 mt-4 text-center font-bold leading-relaxed opacity-60">Limpia tickets y transacciones diarias únicamente.</p>
             </div>
             <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
             </div>
          </div>
        </aside>

        {/* Espacio de trabajo administrativo principal */}
        <main className="xl:col-span-10 bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden flex flex-col min-h-[750px] relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"></div>
          
          <div className="flex-grow overflow-y-auto custom-scrollbar">
            {activeTab === 'users' && <UserManagementView users={users} onAdd={onAddUser} onUpdate={onUpdateUser} onDelete={onDeleteUser} stations={stations} currentUserRole={userRole} />}
            {activeTab === 'services' && <ServiceManagementView services={services} onAdd={onAddService} onUpdate={onUpdateService} onDelete={onDeleteService} />}
            {activeTab === 'stations' && <StationManagementView stations={stations} services={services} users={users} onAdd={onAddStation} onUpdate={onUpdateStation} onDelete={onDeleteStation} />}
            {activeTab === 'printers' && userRole === UserRole.SUPERADMIN && <PrinterManagementView printers={printers} onAdd={onAddPrinter} onUpdate={onUpdatePrinter} onDelete={onDeletePrinter} />}
            {activeTab === 'settings' && userRole === UserRole.SUPERADMIN && (
              <div className="p-10">
                <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-8">Configuración del Sistema</h3>
                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 max-w-2xl">
                  <h4 className="text-xl font-bold text-slate-800 mb-6">Sonido de Notificación (Display)</h4>
                  <div className="space-y-4">
                    {['campana', 'timbre', 'alerta'].map(sound => (
                      <label key={sound} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 cursor-pointer hover:border-indigo-300 transition-colors">
                        <div className="flex items-center gap-4">
                          <input 
                            type="radio" 
                            name="notificationSound" 
                            value={sound}
                            checked={state.displaySettings?.notificationSound === sound}
                            onChange={() => updateDisplaySettings({ ...state.displaySettings, notificationSound: sound })}
                            className="w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="font-bold text-slate-700 capitalize">{sound}</span>
                        </div>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            import('@/lib/audio').then(m => m.playNotificationSound(sound, state.displaySettings?.notificationVolume ?? 1, state.displaySettings?.notificationDuration ?? 1));
                          }}
                          className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-indigo-100 hover:text-indigo-600 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                        </button>
                      </label>
                    ))}
                  </div>
                  
                  <div className="mt-8">
                    <h4 className="text-xl font-bold text-slate-800 mb-4">Volumen de Notificación</h4>
                    <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon></svg>
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.1" 
                        value={state.displaySettings?.notificationVolume ?? 1}
                        onChange={(e) => updateDisplaySettings({ ...state.displaySettings, notificationVolume: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <h4 className="text-xl font-bold text-slate-800 mb-4">Duración de Notificación</h4>
                    <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      <input 
                        type="range" 
                        min="0.5" 
                        max="3" 
                        step="0.1" 
                        value={state.displaySettings?.notificationDuration ?? 1}
                        onChange={(e) => updateDisplaySettings({ ...state.displaySettings, notificationDuration: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <span className="font-mono text-sm font-bold text-slate-500 w-12 text-right">
                        {(state.displaySettings?.notificationDuration ?? 1).toFixed(1)}x
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'analytics' && (
              <div className="p-4 lg:p-8">
                 <DashboardView 
                    tickets={state.tickets} 
                    services={state.services} 
                    stations={state.stations} 
                 />
              </div>
            )}
            {activeTab === 'versions' && (
              <VersionControlView 
                state={state} 
                currentUserRole={userRole} 
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

const StaffController: React.FC<{ 
  user: User, 
  tickets: Ticket[], 
  services: Service[], 
  stations: Station[],
  isServiceActive: (service: Service, station?: Station) => boolean,
  updateTicketStatus: (t: string, s: TicketStatus, st: string) => void 
}> = ({ user, tickets, services, stations, isServiceActive, updateTicketStatus }) => {
  const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.SUPERADMIN;
  const defaultStationId = isAdmin 
    ? (stations.find(s => s.active)?.id || null) 
    : (user.assignedStationId || null);
    
  const [activeStationId, setActiveStationId] = useState<string | null>(() => defaultStationId);

  // Sincronizar de inmediato la estación activa para operadores y auto-seleccionar para administradores
  useEffect(() => {
    if (!isAdmin) {
      // Para operadores: siempre vincular a su estación asignada
      setActiveStationId(user.assignedStationId || null);
    } else if (isAdmin && (!activeStationId || !stations.some(s => s.id === activeStationId && s.active))) {
      // Para administradores: si aún no hay módulo activo seleccionado, auto-seleccionar el primero activo
      const firstActive = stations.find(s => s.active);
      if (firstActive) {
        setActiveStationId(firstActive.id);
      }
    }
  }, [user.assignedStationId, isAdmin, activeStationId, stations]);

  const activeStation = useMemo(() => 
    stations.find(s => s.id === activeStationId),
  [stations, activeStationId]);

  const handleSelectStation = useCallback((id: string) => {
    if (isAdmin) {
      setActiveStationId(id);
    }
  }, [isAdmin]);

  if (!isAdmin && (!activeStationId || !activeStation || !activeStation.active)) {
    return (
      <div className="h-[500px] flex flex-col items-center justify-center text-slate-400 max-w-lg text-center mx-auto space-y-6 animate-fade-in">
        <div className="w-24 h-24 bg-slate-100 rounded-[2.5rem] flex items-center justify-center text-5xl grayscale opacity-50">🔒</div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Módulo No Disponible</h2>
        <p className="text-slate-500 font-medium leading-relaxed italic">
          {!activeStationId 
            ? 'Su perfil no cuenta con una estación de trabajo vinculada. Contacte con la administración de GESFIL para su asignación.'
            : 'El módulo asignado se encuentra temporalmente inactivo. Contacte a la administración para su activación.'}
        </p>
      </div>
    );
  }

  return (
    <StaffView 
      station={activeStation || null} 
      allStations={isAdmin ? stations.filter(s => s.active) : stations.filter(s => s.id === user.assignedStationId && s.active)}
      tickets={tickets} 
      services={services} 
      userRole={user.role}
      isServiceActive={isServiceActive}
      onStatusUpdate={updateTicketStatus} 
      onSelectStation={isAdmin ? handleSelectStation : undefined}
    />
  );
};

const AppShell: React.FC<{
  currentUser: User;
  role: UserRole;
  logout: () => void;
  children: React.ReactNode;
}> = ({ currentUser, role, logout, children }) => {
  const location = useLocation();
  const isTotem = location.pathname.startsWith('/totem');
  const isDisplay = location.pathname.startsWith('/display');
  const isKioskOrDisplay = isTotem || isDisplay;

  return (
    <div className={`min-h-screen ${isDisplay ? 'bg-[#020617] pb-0' : isTotem ? 'bg-slate-50 pb-0' : 'bg-[#f8fafc] pb-32'}`}>
      {!isKioskOrDisplay && (
        <CorporateHeader currentUser={currentUser} onLogout={logout} />
      )}
      {children}
      <Nav role={role} logout={logout} currentUser={currentUser} />
    </div>
  );
};

const App: React.FC = () => {
  const { 
    state, addTicket, updateTicketStatus, resetSystem, login, logout, 
    addUser, updateUser, deleteUser,
    addService, updateService, deleteService,
    addStation, updateStation, deleteStation,
    addPrinter, updatePrinter, deletePrinter, updateDisplaySettings,
    isServiceActive, seedDatabase
  } = useGesfilStore();

  if (!state.currentUser) {
    return <LoginViewComponent onLogin={login} onSeed={seedDatabase} isInitialized={state.users.length > 0} />;
  }

  const role = state.currentUser.role;
  const user = state.currentUser;

  return (
    <Router>
      <AppShell currentUser={state.currentUser} role={role} logout={logout}>
        <Routes>
          <Route path="/" element={
            role === UserRole.TOTEM ? <Navigate to="/totem" /> :
            role === UserRole.DISPLAY ? <Navigate to="/display" /> :
            role === UserRole.STAFF ? <Navigate to="/staff" /> :
            [UserRole.ADMIN, UserRole.SUPERADMIN].includes(role) ? <Navigate to="/admin" /> :
            <Navigate to="/totem" />
          } />

          <Route path="/totem" element={
            [UserRole.TOTEM, UserRole.ADMIN, UserRole.SUPERADMIN].includes(role) 
              ? <TotemView 
                  services={state.services} 
                  stations={state.stations} 
                  nextSequence={state.nextSequence} 
                  onIssueTicket={addTicket} 
                  printers={state.printers} 
                  isServiceActive={isServiceActive} 
                /> 
              : <Navigate to="/" />
          } />
          
          <Route path="/staff" element={
            [UserRole.STAFF, UserRole.ADMIN, UserRole.SUPERADMIN].includes(role) ? (
              <div className="py-12 px-6">
                <StaffController 
                  user={user}
                  tickets={state.tickets}
                  services={state.services}
                  stations={state.stations}
                  isServiceActive={isServiceActive}
                  updateTicketStatus={updateTicketStatus}
                />
              </div>
            ) : <Navigate to="/" />
          } />
          
          <Route path="/display" element={
            [UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF, UserRole.TOTEM, UserRole.DISPLAY].includes(role) 
              ? <PublicDisplayView tickets={state.tickets} stations={state.stations} services={state.services} displaySettings={state.displaySettings} />
              : <Navigate to="/" />
          } />
          
          <Route path="/admin" element={
            [UserRole.ADMIN, UserRole.SUPERADMIN].includes(role) ? (
              <div className="space-y-4">
                 <AdminPanel 
                  state={state}
                  reset={resetSystem} 
                  seed={seedDatabase}
                  userRole={role} 
                  users={state.users}
                  onAddUser={addUser}
                  onUpdateUser={updateUser}
                  onDeleteUser={deleteUser}
                  services={state.services}
                  onAddService={addService}
                  onUpdateService={updateService}
                  onDeleteService={deleteService}
                  stations={state.stations}
                  onAddStation={addStation}
                  onUpdateStation={updateStation}
                  onDeleteStation={deleteStation}
                  printers={state.printers}
                  onAddPrinter={addPrinter}
                  onUpdatePrinter={updatePrinter}
                  onDeletePrinter={deletePrinter}
                  updateDisplaySettings={updateDisplaySettings}
                />
              </div>
            ) : <Navigate to="/" />
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AppShell>
    </Router>
  );
};

export default App;
