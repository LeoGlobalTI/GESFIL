
import React, { useState } from 'react';
import { Service } from '@/types';
import ConfirmationModal from './ConfirmationModal';

interface ServiceManagementViewProps {
  services: Service[];
  onAdd: (data: Omit<Service, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Service>) => void;
  onDelete: (id: string) => void;
}

const ServiceManagementView: React.FC<ServiceManagementViewProps> = ({ services, onAdd, onUpdate, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    prefix: '',
    color: '#3b82f6',
    description: '',
    active: true
  });

  const handleOpenModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        prefix: service.prefix,
        color: service.color,
        description: service.description,
        active: service.active
      });
    } else {
      setEditingService(null);
      setFormData({ name: '', prefix: '', color: '#3b82f6', description: '', active: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingService) {
      onUpdate(editingService.id, formData);
    } else {
      onAdd(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-10 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50/30 gap-6">
        <div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">Esquema de Servicios</h3>
          <p className="text-[11px] text-slate-500 font-bold mt-1 uppercase tracking-[0.2em]">Definición de colas lógicas y segmentación operativa</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-2xl shadow-indigo-100 flex items-center gap-3 active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Nueva Unidad Lógica
        </button>
      </div>

      <div className="p-10 flex-grow overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
          {services.map(service => {
            return (
              <div key={service.id} className="group relative bg-white border border-slate-100 rounded-[2.5rem] p-6 hover:border-indigo-200 hover:shadow-2xl transition-all duration-500 overflow-hidden">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -translate-y-12 translate-x-12 opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                 
                 <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 rounded-[1.75rem] flex items-center justify-center text-2xl font-black text-white shadow-2xl ring-4 ring-white" style={{ backgroundColor: service.color }}>
                      {service.prefix}
                    </div>
                    <div className="flex-grow min-w-0">
                       <h4 className="text-lg font-black text-slate-900 truncate pr-2 mb-1">{service.name}</h4>
                       <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                         service.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                       }`}>
                         {service.active ? 'Routing Activo' : 'Offline'}
                       </span>
                    </div>
                 </div>

                 <p className="text-xs text-slate-400 font-medium leading-relaxed mt-4 h-10 line-clamp-2">
                   {service.description || 'Sin descripción técnica disponible para esta unidad.'}
                 </p>

                 <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-end relative z-10 gap-2">
                    <button onClick={() => handleOpenModal(service)} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </button>
                    <button onClick={() => { setServiceToDelete(service); setShowDeleteModal(true); }} className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                 </div>
              </div>
            );
          })}
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          if (serviceToDelete) {
            onDelete(serviceToDelete.id);
            setServiceToDelete(null);
          }
        }}
        title="Eliminar Servicio"
        message={`¿Estás seguro de que deseas eliminar el servicio "${serviceToDelete?.name}"? Esta acción no se puede deshacer.`}
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh] ring-1 ring-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
              <h4 className="text-xl font-black text-slate-900 tracking-tight">
                {editingService ? 'Ajustes de Servicio' : 'Nueva Unidad'}
              </h4>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 rounded-full hover:bg-white transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <div className="overflow-y-auto custom-scrollbar flex-grow">
                <form id="service-form" onSubmit={handleSubmit} className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Identificador Comercial</label>
                    <input 
                      type="text" required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600/20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Routing Code</label>
                        <input 
                        type="text" required maxLength={4}
                        value={formData.prefix}
                        onChange={e => setFormData({...formData, prefix: e.target.value.toUpperCase()})}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-slate-900 text-center uppercase focus:ring-2 focus:ring-indigo-600/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Identity Color</label>
                      <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3">
                        <input 
                          type="color" required
                          value={formData.color}
                          onChange={e => setFormData({...formData, color: e.target.value})}
                          className="w-10 h-10 bg-transparent cursor-pointer rounded-lg overflow-hidden border-none"
                        />
                        <span className="font-mono text-[11px] font-black text-slate-500 uppercase">{formData.color}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Descripción de Operación</label>
                    <textarea 
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-medium text-slate-600 resize-none h-24 focus:ring-2 focus:ring-indigo-600/20"
                      placeholder="Defina el alcance de esta unidad de servicio..."
                    />
                  </div>
                </form>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3 flex-shrink-0">
                <button 
                  type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 bg-white text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all border border-slate-200"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" form="service-form"
                  className="flex-1 py-4 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                >
                  Confirmar
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceManagementView;
