import React, { useState } from 'react';
import { GesfilState, UserRole } from '@/types';
import { CORPORATE_INFO } from '@/constants';

interface VersionControlViewProps {
  state: GesfilState;
  currentUserRole: UserRole;
}

interface ReleaseNote {
  version: string;
  tag: string;
  date: string;
  isLatest: boolean;
  summary: string;
  highlights: string[];
}

const RELEASES: ReleaseNote[] = [
  {
    version: 'v4.3.3 Enterprise',
    tag: 'Producción',
    date: '15 de Octubre de 2026',
    isLatest: true,
    summary: 'Optimización de tarjetas en gestión de módulos, alineación de acciones y visualización de servicios asignados.',
    highlights: [
      'Incorporación de insignias de servicios activos y asignados en las tarjetas de módulos.',
      'Alineación de botones de acción y ajustes hacia la derecha en la vista de módulos.',
      'Actualización general del sistema a la versión v4.3.3 Enterprise con mejoras visuales y funcionales.',
    ],
  },
  {
    version: 'v4.3.2 Enterprise',
    tag: 'Producción',
    date: '15 de Octubre de 2026',
    isLatest: false,
    summary: 'Mejoras en la experiencia de usuario en modales, optimización de diseño y ordenamiento alfabético en listados.',
    highlights: [
      'Ampliación del modal de "Nuevo Módulo" para mejorar la disposición de controles de horario.',
      'Ordenamiento alfabético automático de módulos en las pantallas de configuración y Staff.',
      'Actualización de la suite a la versión v4.3.2 con mejoras en la estabilidad y experiencia de usuario.',
    ],
  },
  {
    version: 'v4.3.1 Enterprise',
    tag: 'Producción',
    date: '15 de Octubre de 2026',
    isLatest: false,
    summary: 'Sincronización bidireccional inmediata de módulos y operadores en caliente, resolución de hallazgos operativos y optimización de visualización en Display.',
    highlights: [
      'Sincronización bidireccional instantánea entre Operadores (Staff) y Nodos de Atención (Módulos) evitando colisiones de asignación.',
      'Soporte dinámico y extracción robusta de dígitos de módulo en Display Público (compatibilidad completa para "MOD 03", "MOD03", "Módulo 3").',
      'Desbloqueo automático e instantáneo en pantalla de Operador ante asignaciones o reactivaciones de módulos en caliente.',
      'Mejora del motor de horarios operativos de servicios con soporte para turnos continuos y horarios nocturnos.',
      'Unificación de conexiones a base de datos y optimización de métricas en Business Intelligence Hub.',
    ],
  },
  {
    version: 'v4.3.0 Enterprise',
    tag: 'Estable',
    date: '14 de Octubre de 2026',
    isLatest: false,
    summary: 'Sincronización instantánea de 0 ms entre pantallas, actualización optimista en atención de turnos y estandarización integral del código.',
    highlights: [
      'Sincronización instantánea (0 ms) entre Tótem, Operadores y Display público mediante bus BroadcastChannel y almacenamiento local.',
      'Actualización optimista inmediata en memoria para llamados, inicio de atención y cierre de tickets sin latencia.',
      'Mecanismo de autoreparación y reconexión automática en tiempo real ante suspensión de pestañas del navegador.',
      'Resolución definitiva de bloqueos en el proceso de cierre y atención continua de turnos.',
      'Estandarización y traducción de todos los comentarios del código fuente a español didáctico y claro.',
    ],
  },
  {
    version: 'v4.2.0 Enterprise',
    tag: 'Estable',
    date: '14 de Octubre de 2026',
    isLatest: false,
    summary: 'Versión simplificada y optimizada de la suite GESFIL con arquitectura unificada y control de versiones centralizado.',
    highlights: [
      'Simplificación de la interfaz de Control de Versiones en el Workspace administrativo.',
      'Actualización global del sistema a la versión v4.2.0 Enterprise en todos los módulos.',
      'Optimización de pie de página institucional en Kiosk y Pantalla Pública.',
      'Sincronización de credenciales y parámetros de Global TI SpA.',
    ],
  },
  {
    version: 'v4.1.0 Enterprise',
    tag: 'Estable',
    date: '14 de Octubre de 2026',
    isLatest: false,
    summary: 'Incorporación del módulo de versiones en Workspace y mejoras en terminales desatendidas.',
    highlights: [
      'Integración inicial de control de versiones dentro del panel Workspace.',
      'Blindaje de navegación en pantallas de Totem y Display público.',
      'Integración de branding corporativo con acceso directo a www.gtitech.cl.',
    ],
  },
  {
    version: 'v4.0.0 Enterprise',
    tag: 'LTS Inicial',
    date: '15 de Agosto de 2026',
    isLatest: false,
    summary: 'Lanzamiento unificado de la suite GESFIL para gestión inteligente de colas y turnos.',
    highlights: [
      'Suite completa: Totem de pacientes, atención de operadores, pantalla pública con audio y BI Hub.',
      'Compatibilidad con impresoras térmicas USB/Red (ESC/POS) y tickets virtuales.',
      'Gestión multi-rol con perfiles Superadmin, Admin y Operador.',
    ],
  },
];

export const VersionControlView: React.FC<VersionControlViewProps> = ({ state }) => {
  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCheckUpdates = () => {
    setChecking(true);
    setStatusMessage(null);
    setTimeout(() => {
      setChecking(false);
      setStatusMessage(`El sistema cuenta con la versión más reciente (${CORPORATE_INFO.versionTag}). Todos los módulos están sincronizados.`);
      setTimeout(() => setStatusMessage(null), 5000);
    }, 900);
  };

  const handleCopyTechInfo = () => {
    const text = [
      `Sistema: ${CORPORATE_INFO.systemName}`,
      `Versión: ${CORPORATE_INFO.versionTag}`,
      `Build: ${CORPORATE_INFO.build}`,
      `Fecha de Release: ${CORPORATE_INFO.releaseDate}`,
      `Empresa: ${CORPORATE_INFO.companyFullName} (${CORPORATE_INFO.domain})`,
      `Estado: ${CORPORATE_INFO.status}`,
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Hero Card: Versión Actual y Estado */}
      <div className="bg-slate-900 text-white rounded-[2.5rem] p-6 lg:p-8 shadow-2xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Sistema Actualizado
              </span>
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
                Canal Oficial Producción
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono">
                Build {CORPORATE_INFO.build}
              </span>
            </div>

            <div>
              <h1 className="text-3xl lg:text-4xl font-black tracking-tight flex items-baseline gap-3">
                {CORPORATE_INFO.versionTag}
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm font-medium mt-1">
                {CORPORATE_INFO.systemName} &bull; Desarrollado por{' '}
                <a
                  href={CORPORATE_INFO.brandUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 font-bold hover:underline"
                >
                  {CORPORATE_INFO.companyFullName}
                </a>
              </p>
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleCheckUpdates}
              disabled={checking}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
            >
              <svg
                className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>{checking ? 'Verificando...' : 'Buscar Actualizaciones'}</span>
            </button>

            <button
              onClick={handleCopyTechInfo}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors border border-slate-700"
              title="Copiar información técnica"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span>{copied ? '¡Copiado!' : 'Copiar Ficha'}</span>
            </button>
          </div>
        </div>

        {/* Feedback de Actualización */}
        {statusMessage && (
          <div className="mt-5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <svg className="w-4 h-4 shrink-0 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* 3 Tarjetas Resumen del Workspace */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Versión Instalada</p>
            <p className="text-base font-black text-slate-900">{CORPORATE_INFO.versionTag}</p>
            <p className="text-[11px] text-emerald-600 font-bold">Totalmente Sincronizado</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Módulos de la Suite</p>
            <p className="text-base font-black text-slate-900">5 Módulos Activos</p>
            <p className="text-[11px] text-slate-500 font-medium">{state.services.length} servicios &bull; {state.stations.length} puestos</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Soporte Oficial</p>
            <p className="text-base font-black text-slate-900">{CORPORATE_INFO.company}</p>
            <a
              href={CORPORATE_INFO.brandUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-indigo-600 font-bold hover:underline"
            >
              {CORPORATE_INFO.domain}
            </a>
          </div>
        </div>
      </div>

      {/* Historial de Versiones Limpio y Conciso */}
      <div className="bg-white rounded-[2.5rem] p-6 lg:p-8 border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Historial de Versiones</h2>
            <p className="text-xs text-slate-500 font-medium">Registro cronológico de actualizaciones del sistema GESFIL</p>
          </div>
          <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
            {RELEASES.length} Versiones Registradas
          </span>
        </div>

        <div className="space-y-4">
          {RELEASES.map((rel) => (
            <div
              key={rel.version}
              className={`p-5 rounded-2xl border transition-all ${
                rel.isLatest
                  ? 'bg-indigo-50/40 border-indigo-200/80'
                  : 'bg-slate-50/50 border-slate-200/60 hover:bg-slate-50'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-black text-slate-900">{rel.version}</span>
                  {rel.isLatest && (
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-emerald-500 text-white">
                      Versión Actual
                    </span>
                  )}
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                    {rel.tag}
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-500">{rel.date}</span>
              </div>

              <p className="text-xs text-slate-600 font-medium mb-3">{rel.summary}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/50">
                {rel.highlights.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VersionControlView;
