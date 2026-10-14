
import React from 'react';
import { Service, Station } from '@/types';

export const CORPORATE_INFO = {
  name: 'GESFIL',
  systemName: 'GESFIL Enterprise Suite',
  version: 'v4.3.0 Corporate Edition',
  versionTag: 'v4.3.0 Enterprise',
  build: '2026.10-R5',
  releaseDate: '14 de Octubre de 2026',
  company: 'Global TI',
  companyFullName: 'Global TI SpA',
  brandUrl: 'https://www.gtitech.cl',
  domain: 'www.gtitech.cl',
  support: 'Soporte Corporativo Global TI',
  status: 'ONLINE',
};

// Servicios iniciales predeterminados
export const INITIAL_SERVICES: Service[] = [
  { id: '00000000-0000-0000-0000-000000000001', name: 'Triaje', prefix: 'TR', color: '#3b82f6', description: 'Evaluación inicial de pacientes', active: true },
  { id: '00000000-0000-0000-0000-000000000002', name: 'Farmacia', prefix: 'FM', color: '#10b981', description: 'Entrega de medicamentos', active: true },
  { id: '00000000-0000-0000-0000-000000000003', name: 'Laboratorio', prefix: 'LB', color: '#f59e0b', description: 'Toma de muestras', active: true },
  { id: '00000000-0000-0000-0000-000000000004', name: 'Consultas', prefix: 'CN', color: '#8b5cf6', description: 'Atención médica general', active: true },
];

// Módulos iniciales de atención predeterminados
export const INITIAL_STATIONS: Station[] = [
  { id: '00000000-0000-0000-0000-000000000011', name: 'Módulo 01', operatorName: 'Juan Pérez', serviceIds: ['00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004'], active: true },
  { id: '00000000-0000-0000-0000-000000000012', name: 'Módulo 02', operatorName: 'María García', serviceIds: ['00000000-0000-0000-0000-000000000002'], active: true },
  { id: '00000000-0000-0000-0000-000000000013', name: 'Módulo 03', operatorName: 'Carlos Ruiz', serviceIds: ['00000000-0000-0000-0000-000000000003'], active: true },
];

export const ICONS = {
  Users: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ),
  Activity: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
  ),
  Settings: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
  ),
  Terminal: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
  ),
  Screen: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
  )
};
