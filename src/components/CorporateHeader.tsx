import React from 'react';
import { useLocation } from 'react-router-dom';
import { CORPORATE_INFO } from '@/constants';
import { User, UserRole } from '@/types';

interface CorporateHeaderProps {
  currentUser?: User | null;
  onLogout?: () => void;
}

export const CorporateHeader: React.FC<CorporateHeaderProps> = ({ currentUser, onLogout }) => {
  const location = useLocation();
  const isTotemView = location.pathname.startsWith('/totem');
  const isDisplayView = location.pathname.startsWith('/display');

  // En las pantallas de totem y display el banner corporativo no debe ser visible,
  // ya que da pie a que los usuarios puedan cerrar el aplicativo sin la intención de hacerlo.
  if (isTotemView || isDisplayView) {
    return null;
  }

  const viewTitles: Record<string, { title: string; subtitle: string; icon: string }> = {
    '/totem': { title: 'Terminal de Autoservicio', subtitle: 'Emisión de Turnos', icon: '🎫' },
    '/staff': { title: 'Estación de Atención', subtitle: 'Gestión de Módulos', icon: '🖥️' },
    '/display': { title: 'Monitor Público en Sala', subtitle: 'Llamados en Tiempo Real', icon: '📢' },
    '/admin': { title: 'Centro de Control BI', subtitle: 'Administración & Analítica', icon: '⚙️' },
  };

  const currentView = viewTitles[location.pathname] || {
    title: 'Workspace',
    subtitle: 'Gestión de Fila',
    icon: '⚡',
  };

  const roleLabels: Record<UserRole, string> = {
    [UserRole.SUPERADMIN]: 'Super Administrador',
    [UserRole.ADMIN]: 'Administrador',
    [UserRole.STAFF]: 'Operador de Módulo',
    [UserRole.TOTEM]: 'Terminal Totem',
    [UserRole.DISPLAY]: 'Pantalla Sala',
  };

  return (
    <header
      className={`w-full sticky top-0 z-40 transition-colors duration-300 border-b backdrop-blur-md print:hidden ${
        isDisplayView
          ? 'bg-slate-950/85 border-slate-800/80 text-white shadow-lg'
          : 'bg-white/90 border-slate-200/80 text-slate-900 shadow-sm'
      }`}
    >
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 h-14 md:h-16 flex items-center justify-between gap-3">
        {/* Izquierda: Logotipo y Empresa */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-xl flex items-center justify-center text-white font-black shadow-md shadow-indigo-500/20 text-sm">
              G
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black tracking-tight text-base sm:text-lg leading-none">
                  {CORPORATE_INFO.name}
                  <span className="text-indigo-500">.</span>
                </span>
              </div>
              <p className={`text-[9px] font-bold tracking-wider leading-none mt-0.5 ${isDisplayView ? 'text-slate-400' : 'text-slate-500'}`}>
                {CORPORATE_INFO.systemName}
              </p>
            </div>
          </div>

          <div className={`hidden lg:block h-6 w-px ${isDisplayView ? 'bg-slate-800' : 'bg-slate-200'}`} />

          {/* Enlace oficial a la empresa */}
          <a
            href={CORPORATE_INFO.brandUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Sitio Oficial de Global TI"
            className={`hidden md:flex items-center gap-1.5 text-[11px] font-bold transition-colors group px-2.5 py-1 rounded-lg ${
              isDisplayView
                ? 'text-slate-300 hover:text-white hover:bg-slate-900'
                : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="group-hover:underline">{CORPORATE_INFO.domain}</span>
            <svg
              className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        {/* Centro: Contexto del módulo actual */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
          isDisplayView
            ? 'bg-slate-900/60 border-slate-800 text-slate-300'
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }">
          <span className="text-sm">{currentView.icon}</span>
          <span className="font-black text-[11px] uppercase tracking-wider">{currentView.title}</span>
          <span className="text-slate-400 font-normal">|</span>
          <span className="text-[11px] font-medium text-slate-500">{currentView.subtitle}</span>
        </div>

        {/* Derecha: Estado operativo, versión y usuario */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Indicador de estado en línea */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border ${
              isDisplayView
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>{CORPORATE_INFO.status}</span>
          </div>

          {/* Indicador de versión */}
          <span
            className={`hidden xl:inline-flex items-center text-[10px] font-black px-2.5 py-1 rounded-lg border ${
              isDisplayView
                ? 'bg-slate-900 border-slate-800 text-slate-400'
                : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}
          >
            {CORPORATE_INFO.version}
          </span>

          {currentUser && (
            <div
              className={`flex items-center gap-2 pl-2 sm:pl-3 border-l ${
                isDisplayView ? 'border-slate-800' : 'border-slate-200'
              }`}
            >
              <div
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-500/20 text-indigo-500 border border-indigo-500/30 flex items-center justify-center font-bold text-xs"
                title={`${currentUser.name} (${roleLabels[currentUser.role] || currentUser.role})`}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold leading-tight truncate max-w-[120px]">
                  {currentUser.name}
                </span>
                <span className={`text-[9px] font-bold leading-none ${isDisplayView ? 'text-slate-400' : 'text-slate-500'}`}>
                  {roleLabels[currentUser.role] || currentUser.role}
                </span>
              </div>

              {onLogout && (
                <button
                  onClick={onLogout}
                  title="Cerrar sesión"
                  className={`p-1.5 rounded-lg transition-colors ml-1 ${
                    isDisplayView
                      ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-900'
                      : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default CorporateHeader;
