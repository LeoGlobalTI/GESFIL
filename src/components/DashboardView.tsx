import React, { useMemo, useState, useEffect } from 'react';
import { Ticket, Service, Station, TicketStatus } from '@/types';
import { supabase } from '@/services/supabase';
import { mapTicketFromDb } from '@/utils/mappers';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardViewProps {
  tickets: Ticket[];
  services: Service[];
  stations: Station[];
}


const DashboardView: React.FC<DashboardViewProps> = ({ tickets, services, stations }) => {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');
  const [historicalTickets, setHistoricalTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;

    const fetchHistoricalTickets = async (start: Date, end: Date) => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('tickets')
          .select('*')
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString());
          
        if (error) throw error;
        
        if (data && !ignore) {
          setHistoricalTickets(data.map(mapTicketFromDb));
        }
      } catch (err) {
        if (!ignore) console.error("Error fetching historical tickets", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    if (dateRange === 'today') {
      setHistoricalTickets(tickets);
      return () => { ignore = true; };
    }
    
    let start = new Date();
    let end = new Date();
    
    if (dateRange === 'week') {
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
    } else if (dateRange === 'month') {
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
    }
    
    fetchHistoricalTickets(start, end);

    return () => {
      ignore = true;
    };
  }, [dateRange, tickets]);

  const stats = useMemo(() => {
    const total = historicalTickets.length;
    const completed = historicalTickets.filter(t => t.status === TicketStatus.COMPLETED).length;
    const waiting = historicalTickets.filter(t => t.status === TicketStatus.WAITING).length;

    let totalWaitTime = 0;
    let waitCount = 0;

    const ticketsByModule = stations.map(s => {
      const sTickets = historicalTickets.filter(t => t.stationId === s.id);
      return {
        id: s.id,
        name: s.name,
        ticketsCount: sTickets.length,
        active: s.active,
        operator: s.operatorName || 'Sin asignar'
      };
    });

    const ticketsByService = services.map(s => {
      const sTickets = historicalTickets.filter(t => t.serviceId === s.id);
      return {
        name: s.name,
        count: sTickets.length,
        color: s.color
      };
    });

    historicalTickets.forEach(t => {
        if (t.status === TicketStatus.CANCELLED) return;
        if (t.calledAt) {
          totalWaitTime += (t.calledAt - t.createdAt);
          waitCount++;
        }
    });

    const avgWaitTime = waitCount > 0 ? Math.round(totalWaitTime / waitCount / 60000) : 0;
    
    return { total, completed, waiting, avgWaitTime, ticketsByModule, ticketsByService };
  }, [historicalTickets, stations, services]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8 animate-fade-in">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-8 gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Superadmin Hub</h1>
          <p className="text-sm text-slate-500 font-medium">Vista ejecutiva de métricas y operación</p>
        </div>
        
        {/* Date Filter */}
        <div className="bg-slate-100 p-1 rounded-2xl flex gap-1">
          {(['today', 'week', 'month'] as const).map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize ${dateRange === range ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {range === 'today' ? 'Hoy' : range === 'week' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="text-center py-20 text-slate-400 font-bold">Cargando métricas...</div>
      ) : (
        <>
          {/* KPI Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm w-[380px] h-[220px]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Atenciones</p>
              <p className="text-4xl font-black text-slate-900">{stats.total}</p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm w-[380px] h-[220px]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">T. Promedio Espera</p>
              <p className="text-4xl font-black text-indigo-600">{stats.avgWaitTime} min</p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm w-[380px] h-[220px]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Atendidos</p>
              <p className="text-4xl font-black text-emerald-500">{stats.completed}</p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm w-[380px] h-[220px]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">En Cola</p>
              <p className="text-4xl font-black text-amber-500">{stats.waiting}</p>
            </div>
          </div>

          {/* Service & Module Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="text-lg font-black text-slate-900 mb-6">Atenciones por Servicio</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.ticketsByService}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis fontSize={10} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{fill: '#f8fafc'}} />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {stats.ticketsByService.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
             </div>
             <div className="space-y-6">
                <h3 className="text-lg font-black text-slate-900">Desempeño por Módulo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stats.ticketsByModule.map(m => (
                    <div key={m.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center">
                      <div>
                        <p className="text-sm font-black text-slate-900">{m.name}</p>
                        <p className="text-[11px] font-medium text-slate-400">{m.operator}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-slate-900">{m.ticketsCount}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Turnos</p>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardView;
