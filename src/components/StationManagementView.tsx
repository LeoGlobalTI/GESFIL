
import React, { useState } from 'react';
import { Station, Service } from '@/types';

interface StationManagementViewProps {
  stations: Station[];
  services: Service[];
  onAdd: (data: Omit<Station, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Station>) => void;
  onDelete: (id: string) => void;
}

const StationManagementView: React.FC<StationManagementViewProps> = ({ stations, services, onAdd, onUpdate, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    operatorName: '',
    serviceIds: [] as string[],
    serviceConfigs: {} as Record<string, { startTime?: string, endTime?: string }>,
    active: true
  });

  const handleOpenModal = (station?: Station) => {
    if (station) {
      setEditingStation(station);
      // Ensure all serviceIds have a config entry
      const configs = { ...(station.serviceConfigs || {}) };
      station.serviceIds.forEach(sid => {
        if (!configs[sid]) {
          configs[sid] = {
            startTime: '',
            endTime: ''
          };
        }
      });
      setFormData({
        name: station.name,
        operatorName: station.operatorName,
        serviceIds: station.serviceIds,
        serviceConfigs: configs,
        active: station.active
      });
    } else {
      setEditingStation(null);
      setFormData({ name: '', operatorName: '', serviceIds: [], serviceConfigs: {}, active: true });
    }
    setIsModalOpen(true);
  };

  const toggleService = (id: string) => {
    setFormData(prev => {
      const isSelected = prev.serviceIds.includes(id);
      const newServiceIds = isSelected 
        ? prev.serviceIds.filter(sid => sid !== id)
        : [...prev.serviceIds, id];
      
      const newConfigs = { ...prev.serviceConfigs };
      if (!isSelected) {
        newConfigs[id] = { 
          startTime: '', 
          endTime: '' 
        };
      } else {
        delete newConfigs[id];
      }

      return {
        ...prev,
        serviceIds: newServiceIds,
        serviceConfigs: newConfigs
      };
    });
  };

  const updateServiceConfig = (id: string, field: 'startTime' | 'endTime', value: string) => {
    setFormData(prev => ({
      ...prev,
      serviceConfigs: {
        ...prev.serviceConfigs,
        [id]: {
          ...prev.serviceConfigs[id],
          [field]: value
        }
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.serviceIds.length === 0) return alert('Seleccione al menos un servicio operativo.');
    if (editingStation) {
      onUpdate(editingStation.id, formData);
    } else {
      onAdd(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-10 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50/30 gap-6">
        <div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">Nodos de Atención</h3>
          <p className="text-[11px] text-slate-500 font-bold mt-1 uppercase tracking-[0.2em]">Configuración de puntos físicos y módulos virtuales</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-2xl shadow-indigo-100 flex items-center gap-3 active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Desplegar Módulo
        </button>
      </div>

      <div className="p-10 flex-grow overflow-y-auto custom-scrollbar">
        <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-white text-[10px] uppercase tracking-[0.3em] font-black">
              <tr>
                <th className="px-8 py-6">Módulo</th>
                <th className="px-8 py-6">Responsable</th>
                <th className="px-8 py-6">Routing</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6 text-right">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {stations.map(station => (
                <tr key={station.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-8 bg-indigo-500 rounded-full"></div>
                      <span className="font-black text-slate-900 text-lg tracking-tight">{station.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm font-bold text-slate-600">{station.operatorName}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                      {station.serviceIds.map(sid => {
                        const s = services.find(srv => srv.id === sid);
                        if (!s) return null;
                        return (
                          <span key={sid} className="px-2 py-1 rounded-lg text-[8px] font-black text-white shadow-sm" style={{ backgroundColor: s.color }}>
                            {s.prefix}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${station.active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                      <span className={`text-[9px] font-black uppercase tracking-widest ${
                        station.active ? 'text-emerald-600' : 'text-slate-400'
                      }`}>
                        {station.active ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => handleOpenModal(station)} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                      </button>
                      <button 
                        onClick={() => confirm(`¿Eliminar "${station.name}"?`) && onDelete(station.id)}
                        className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h4 className="text-2xl font-black text-slate-900 tracking-tight">
                {editingStation ? 'Ajustes de Nodo' : 'Desplegar Módulo'}
              </h4>
              <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-slate-900 rounded-full hover:bg-white transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Identificador de Módulo</label>
                <input 
                  type="text" required placeholder="Ej: Módulo 01"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Operador Responsable</label>
                <input 
                  type="text" placeholder="Ej: Juan Pérez (Opcional)"
                  value={formData.operatorName}
                  onChange={e => setFormData({...formData, operatorName: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600/20"
                />
              </div>
              
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mapping de Servicios</label>
                <div className="flex flex-wrap gap-2 p-6 bg-slate-50 rounded-[2rem] border border-slate-200 shadow-inner">
                  {services.filter(s => s.active).map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleService(s.id)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border-2 shadow-sm ${
                        formData.serviceIds.includes(s.id)
                        ? "bg-slate-900 border-slate-900 text-white"
                        : "bg-white border-white text-slate-400 hover:border-indigo-100"
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>

                {formData.serviceIds.length > 0 && (
                  <div className="space-y-3 mt-4">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Horarios por Servicio</label>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                      {formData.serviceIds.map(sid => {
                        const s = services.find(srv => srv.id === sid);
                        if (!s) return null;
                        return (
                          <div key={sid} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }}></div>
                              <span className="text-[10px] font-black text-slate-700 uppercase">{s.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input 
                                type="time"
                                value={formData.serviceConfigs[sid]?.startTime || ''}
                                onChange={e => updateServiceConfig(sid, 'startTime', e.target.value)}
                                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                              />
                              <span className="text-[10px] font-black text-slate-300">-</span>
                              <input 
                                type="time"
                                value={formData.serviceConfigs[sid]?.endTime || ''}
                                onChange={e => updateServiceConfig(sid, 'endTime', e.target.value)}
                                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6 flex gap-4">
                <button 
                  type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-5 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                >
                  Confirmar Nodo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StationManagementView;
