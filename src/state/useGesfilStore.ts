import { useState, useEffect, useCallback, useRef } from 'react';
import { Ticket, TicketStatus, Service, Station, GesfilState, User, UserRole, Printer } from '@/types';
import { INITIAL_SERVICES, INITIAL_STATIONS } from '@/constants';
import { supabase } from '@/services/supabase';
import { mapServiceFromDb, mapStationFromDb, mapTicketFromDb, mapUserFromDb, mapPrinterFromDb } from '@/utils/mappers';

// Usuarios iniciales del sistema
const DEFAULT_USERS: User[] = [
  { id: '00000000-0000-0000-0000-000000000021', username: 'superadmin', password: '123', name: 'Super Administrador', role: UserRole.SUPERADMIN },
  { id: '00000000-0000-0000-0000-000000000022', username: 'admin', password: '123', name: 'Gestor Operativo', role: UserRole.ADMIN },
  { id: '00000000-0000-0000-0000-000000000023', username: 'staff1', password: '123', name: 'Operario 01', role: UserRole.STAFF, assignedStationId: '00000000-0000-0000-0000-000000000011' },
  { id: '00000000-0000-0000-0000-000000000024', username: 'totem', password: '123', name: 'Tótem Entrada', role: UserRole.TOTEM },
  { id: '00000000-0000-0000-0000-000000000025', username: 'live', password: '123', name: 'Display Live', role: UserRole.DISPLAY },
];

const CANAL_SINCRONIZACION = 'gesfil_multi_screen_sync';
const CLAVE_ALMACENAMIENTO_SYNC = 'gesfil_sync_event_v1';

// Función para avisar al instante a todas las pantallas abiertas (comunicación directa en 0 milisegundos)
export const broadcastScreenEvent = (payload: any) => {
  try {
    if (typeof window !== 'undefined') {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel(CANAL_SINCRONIZACION);
        bc.postMessage({ ...payload, timestamp: Date.now() });
        bc.close();
      }
      localStorage.setItem(CLAVE_ALMACENAMIENTO_SYNC, JSON.stringify({ ...payload, timestamp: Date.now() }));
    }
  } catch (err) {
    console.warn('Aviso de sincronización:', err);
  }
};

export const useGesfilStore = () => {
  const [state, setState] = useState<GesfilState>({
    services: [],
    stations: [],
    tickets: [],
    nextSequence: { sequences: {} },
    displaySettings: { notificationSound: 'timbre' },
    users: [],
    currentUser: null,
    printers: []
  });

  const [loading, setLoading] = useState(true);
  const isSubscribedRef = useRef(false);

  // Obtener únicamente los turnos del día para consultas rápidas
  const fetchTicketsOnly = useCallback(async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: tickets, error } = await supabase
        .from('tickets')
        .select('id, code, service_id, status, created_at, called_at, started_at, ended_at, station_id, recalled_count, priority')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && tickets) {
        const mapped = tickets.map(mapTicketFromDb);
        setState(prev => {
          // Comprobar si hubo cambios reales para evitar redibujados innecesarios
          const currentSignature = prev.tickets.map(t => `${t.id}:${t.status}:${t.calledAt}:${t.metadata?.recalledCount}`).join('|');
          const newSignature = mapped.map(t => `${t.id}:${t.status}:${t.calledAt}:${t.metadata?.recalledCount}`).join('|');
          if (currentSignature === newSignature) {
            return prev;
          }
          return { ...prev, tickets: mapped };
        });
      }
    } catch (err) {
      console.warn('Error al consultar turnos recientes:', err);
    }
  }, []);

  // Carga inicial completa de datos del sistema
  const fetchAll = useCallback(async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        { data: services, error: errServices },
        { data: stations, error: errStations },
        { data: tickets, error: errTickets },
        { data: users, error: errUsers },
        { data: printers, error: errPrinters },
        { data: configs, error: errConfigs }
      ] = await Promise.all([
        supabase.from('services').select('id, name, prefix, color, description, active'),
        supabase.from('stations').select('id, name, operator_name, service_ids, service_configs, active'),
        supabase.from('tickets').select('id, code, service_id, status, created_at, called_at, started_at, ended_at, station_id, recalled_count, priority').gte('created_at', today.toISOString()).order('created_at', { ascending: false }).limit(100),
        supabase.from('users').select('id, username, password, name, role, assigned_station_id'),
        supabase.from('printers').select('id, name, type, address, port, active'),
        supabase.from('system_config').select('key, value').in('key', ['nextSequence', 'displaySettings'])
      ]);

      if (errServices || errStations || errTickets || errUsers || errPrinters || errConfigs) {
        console.error("Error al cargar datos iniciales:", { errServices, errStations, errTickets, errUsers, errPrinters, errConfigs });
      }

      const nextSeqConfig = configs?.find(c => c.key === 'nextSequence');
      const displayConfig = configs?.find(c => c.key === 'displaySettings');

      setState(prev => ({
        ...prev,
        services: (services || []).map(mapServiceFromDb),
        stations: (stations || []).map(mapStationFromDb),
        tickets: (tickets || []).map(mapTicketFromDb),
        users: (users || []).map(mapUserFromDb),
        printers: (printers || []).map(mapPrinterFromDb),
        nextSequence: nextSeqConfig?.value || { sequences: {} },
        displaySettings: displayConfig?.value || { notificationSound: 'timbre' }
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  // Función interna para procesar eventos sincronizados entre pestañas o pantallas
  const handleIncomingSyncEvent = useCallback((data: any) => {
    if (!data || !data.type) return;

    if (data.type === 'TICKET_UPDATE' && data.ticket) {
      setState(prev => {
        const tickets = [...prev.tickets];
        const idx = tickets.findIndex(t => t.id === data.ticket.id);
        if (idx !== -1) {
          tickets[idx] = data.ticket;
        } else {
          tickets.unshift(data.ticket);
        }
        return { ...prev, tickets };
      });
    } else if (data.type === 'TICKET_INSERT' && data.ticket) {
      setState(prev => {
        const exists = prev.tickets.some(t => t.id === data.ticket.id);
        if (exists) return prev;
        return { ...prev, tickets: [data.ticket, ...prev.tickets] };
      });
    } else if (data.type === 'SYSTEM_RESET') {
      setState(prev => ({ ...prev, tickets: [] }));
    } else if (data.type === 'SERVICE_UPDATE' && data.service) {
      setState(prev => {
        const services = [...prev.services];
        const idx = services.findIndex(s => s.id === data.service.id);
        if (idx !== -1) {
          services[idx] = { ...services[idx], ...data.service };
        } else {
          services.push(data.service);
        }
        return { ...prev, services };
      });
    } else if (data.type === 'SERVICE_DELETE' && data.id) {
      setState(prev => ({
        ...prev,
        services: prev.services.filter(s => s.id !== data.id)
      }));
    } else if (data.type === 'STATION_UPDATE' && data.station) {
      setState(prev => {
        const stations = [...prev.stations];
        const idx = stations.findIndex(s => s.id === data.station.id);
        if (idx !== -1) {
          stations[idx] = { ...stations[idx], ...data.station };
        } else {
          stations.push(data.station);
        }
        return { ...prev, stations };
      });
    } else if (data.type === 'STATION_DELETE' && data.id) {
      setState(prev => ({
        ...prev,
        stations: prev.stations.filter(s => s.id !== data.id)
      }));
    } else if (data.type === 'USER_UPDATE' && data.user) {
      setState(prev => {
        const users = [...prev.users];
        const idx = users.findIndex(u => u.id === data.user.id);
        if (idx !== -1) {
          users[idx] = { ...users[idx], ...data.user };
        } else {
          users.push(data.user);
        }
        let currentUser = prev.currentUser;
        if (currentUser && currentUser.id === data.user.id) {
          currentUser = { ...currentUser, ...data.user };
          try {
            localStorage.setItem('gesfil_user', JSON.stringify(currentUser));
          } catch (e) {}
        }
        return { ...prev, users, currentUser };
      });
    } else if (data.type === 'USER_DELETE' && data.id) {
      setState(prev => ({
        ...prev,
        users: prev.users.filter(u => u.id !== data.id),
        currentUser: prev.currentUser?.id === data.id ? null : prev.currentUser
      }));
    } else if (data.type === 'PRINTER_UPDATE' && data.printer) {
      setState(prev => {
        const printers = [...prev.printers];
        const idx = printers.findIndex(p => p.id === data.printer.id);
        if (idx !== -1) {
          printers[idx] = { ...printers[idx], ...data.printer };
        } else {
          printers.push(data.printer);
        }
        return { ...prev, printers };
      });
    } else if (data.type === 'PRINTER_DELETE' && data.id) {
      setState(prev => ({
        ...prev,
        printers: prev.printers.filter(p => p.id !== data.id)
      }));
    } else if (data.type === 'SETTINGS_UPDATE' && data.settings) {
      setState(prev => ({
        ...prev,
        displaySettings: data.settings
      }));
    } else if (data.type === 'FULL_REFRESH') {
      fetchAll();
    }
  }, [fetchAll]);

  // Sincronización entre pantallas: BroadcastChannel, almacenamiento local, tiempo real y respaldo periódico
  useEffect(() => {
    let isCleaningUp = false;
    fetchAll();

    // 1. Escucha en canal BroadcastChannel (comunicación instantánea entre pestañas en 0 milisegundos)
    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel(CANAL_SINCRONIZACION);
      bc.onmessage = (event) => {
        if (!isCleaningUp) {
          handleIncomingSyncEvent(event.data);
        }
      };
    }

    // 2. Escucha de eventos de almacenamiento (respaldo para sincronizar pestañas en cualquier navegador)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === CLAVE_ALMACENAMIENTO_SYNC && e.newValue && !isCleaningUp) {
        try {
          const data = JSON.parse(e.newValue);
          handleIncomingSyncEvent(data);
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    // 3. Conexión en tiempo real con Supabase (canal estable y sin bucles de reconexión)
    let realtimeChannel: any = null;

    const setupRealtime = () => {
      if (isCleaningUp) return;
      if (realtimeChannel) {
        try {
          supabase.removeChannel(realtimeChannel);
        } catch (e) {}
      }

      realtimeChannel = supabase.channel('gesfil_realtime_main')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, (payload) => {
          setState(prev => {
            const services = [...prev.services];
            if (payload.eventType === 'INSERT') {
              const mapped = mapServiceFromDb(payload.new);
              if (!services.some(s => s.id === mapped.id)) services.push(mapped);
            }
            if (payload.eventType === 'UPDATE') {
              const mapped = mapServiceFromDb(payload.new);
              const index = services.findIndex(s => s.id === mapped.id);
              if (index !== -1) services[index] = mapped;
              else services.push(mapped);
            }
            if (payload.eventType === 'DELETE') {
              return { ...prev, services: services.filter(s => s.id !== payload.old.id) };
            }
            return { ...prev, services };
          });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'stations' }, (payload) => {
          setState(prev => {
            const stations = [...prev.stations];
            if (payload.eventType === 'INSERT') {
              const mapped = mapStationFromDb(payload.new);
              if (!stations.some(s => s.id === mapped.id)) stations.push(mapped);
            }
            if (payload.eventType === 'UPDATE') {
              const mapped = mapStationFromDb(payload.new);
              const index = stations.findIndex(s => s.id === mapped.id);
              if (index !== -1) stations[index] = mapped;
              else stations.push(mapped);
            }
            if (payload.eventType === 'DELETE') {
              return { ...prev, stations: stations.filter(s => s.id !== payload.old.id) };
            }
            return { ...prev, stations };
          });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, (payload) => {
          setState(prev => {
            const tickets = [...prev.tickets];
            if (payload.eventType === 'INSERT') {
              const mapped = mapTicketFromDb(payload.new);
              const idx = tickets.findIndex(t => t.id === mapped.id);
              if (idx === -1) {
                tickets.unshift(mapped);
              } else {
                tickets[idx] = mapped;
              }
            }
            if (payload.eventType === 'UPDATE') {
              const mapped = mapTicketFromDb(payload.new);
              const index = tickets.findIndex(t => t.id === mapped.id);
              if (index !== -1) {
                tickets[index] = mapped;
              } else {
                tickets.unshift(mapped);
              }
            }
            if (payload.eventType === 'DELETE') {
              return { ...prev, tickets: tickets.filter(t => t.id !== payload.old.id) };
            }
            return { ...prev, tickets };
          });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
          setState(prev => {
            const users = [...prev.users];
            let currentUser = prev.currentUser;
            
            if (payload.eventType === 'INSERT') {
              const mapped = mapUserFromDb(payload.new);
              if (!users.some(u => u.id === mapped.id)) users.push(mapped);
            }
            if (payload.eventType === 'UPDATE') {
              const mapped = mapUserFromDb(payload.new);
              const index = users.findIndex(u => u.id === mapped.id);
              if (index !== -1) users[index] = mapped;
              else users.push(mapped);
              if (currentUser && currentUser.id === mapped.id) {
                currentUser = mapped;
              }
            }
            if (payload.eventType === 'DELETE') {
              const filtered = users.filter(u => u.id !== payload.old.id);
              if (currentUser && currentUser.id === payload.old.id) currentUser = null;
              return { ...prev, users: filtered, currentUser };
            }
            return { ...prev, users, currentUser };
          });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'printers' }, (payload) => {
          setState(prev => {
            const printers = [...prev.printers];
            if (payload.eventType === 'INSERT') {
              const mapped = mapPrinterFromDb(payload.new);
              if (!printers.some(p => p.id === mapped.id)) printers.push(mapped);
            }
            if (payload.eventType === 'UPDATE') {
              const mapped = mapPrinterFromDb(payload.new);
              const index = printers.findIndex(p => p.id === mapped.id);
              if (index !== -1) printers[index] = mapped;
              else printers.push(mapped);
            }
            if (payload.eventType === 'DELETE') {
              return { ...prev, printers: printers.filter(p => p.id !== payload.old.id) };
            }
            return { ...prev, printers };
          });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'system_config' }, fetchAll)
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            isSubscribedRef.current = true;
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            isSubscribedRef.current = false;
            // Solo reintentar si no estamos desmontando y hubo error de red
            if (!isCleaningUp) {
              setTimeout(() => {
                if (!isCleaningUp) setupRealtime();
              }, 4000);
            }
          }
        });
    };

    setupRealtime();

    // 4. Consulta periódica rápida (cada 2.5 segundos) para turnos
    const fastPoll = setInterval(() => {
      fetchTicketsOnly();
    }, 2500);

    // 5. Consulta periódica de configuración y operadores cada 10 segundos como salvaguarda
    const configPoll = setInterval(async () => {
      try {
        const [
          { data: services },
          { data: stations },
          { data: users }
        ] = await Promise.all([
          supabase.from('services').select('id, name, prefix, color, description, active'),
          supabase.from('stations').select('id, name, operator_name, service_ids, service_configs, active'),
          supabase.from('users').select('id, username, password, name, role, assigned_station_id')
        ]);
        if (services && stations && users) {
          const mappedUsers = users.map(mapUserFromDb);
          setState(prev => {
            let currentUser = prev.currentUser;
            if (currentUser) {
              const freshUser = mappedUsers.find(u => u.id === currentUser!.id);
              if (freshUser && (freshUser.assignedStationId !== currentUser.assignedStationId || freshUser.role !== currentUser.role)) {
                currentUser = freshUser;
              }
            }
            return {
              ...prev,
              services: services.map(mapServiceFromDb),
              stations: stations.map(mapStationFromDb),
              users: mappedUsers,
              currentUser
            };
          });
        }
      } catch (err) {}
    }, 10000);

    // 6. Recuperación automática al reactivarse la pestaña o reconectarse a internet
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchAll();
        if (!isSubscribedRef.current && !isCleaningUp) {
          setupRealtime();
        }
      }
    };
    const handleOnline = () => {
      fetchAll();
      setupRealtime();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('online', handleOnline);

    return () => {
      isCleaningUp = true;
      clearInterval(fastPoll);
      clearInterval(configPoll);
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('online', handleOnline);
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [fetchAll, fetchTicketsOnly, handleIncomingSyncEvent]);

  // Persistencia de la sesión del usuario en el navegador
  useEffect(() => {
    const savedUser = localStorage.getItem('gesfil_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setState(prev => ({ ...prev, currentUser: user }));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (state.currentUser) {
      localStorage.setItem('gesfil_user', JSON.stringify(state.currentUser));
    } else {
      localStorage.removeItem('gesfil_user');
    }
  }, [state.currentUser]);

  // Iniciar sesión
  const login = useCallback(async (username: string, password?: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username.trim())
      .eq('password', password)
      .maybeSingle();

    if (data && !error) {
      const user = mapUserFromDb(data);
      setState(prev => ({ ...prev, currentUser: user }));
      return true;
    }
    return false;
  }, []);

  // Cerrar sesión
  const logout = useCallback(() => setState(prev => ({ ...prev, currentUser: null })), []);

  // Crear un nuevo turno (Tótem)
  const addTicket = useCallback(async (serviceId: string, priority: boolean = false) => {
    const service = state.services.find(s => s.id === serviceId);
    if (!service) return null;

    let currentSeq = 1;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    today.setHours(0, 0, 0, 0);

    let config = { ...state.nextSequence };
    if (config.lastResetDate !== todayStr) {
      config = { lastResetDate: todayStr, sequences: {} };
    }
    if (!config.sequences) config.sequences = {};

    try {
      // Calcular número correlativo evitando saltos o colisiones
      const { data: todayTickets, error } = await supabase
        .from('tickets')
        .select('code')
        .eq('service_id', serviceId)
        .gte('created_at', today.toISOString());
        
      let maxNum = 0;
      if (!error && todayTickets) {
        todayTickets.forEach(t => {
          if (t.code && t.code.startsWith(service.prefix)) {
            const numPart = parseInt(t.code.replace(service.prefix, ''), 10);
            if (!isNaN(numPart) && numPart > maxNum) {
              maxNum = numPart;
            }
          }
        });
      }
      const localSeq = config.sequences[serviceId] || 0;
      currentSeq = Math.max(maxNum + 1, localSeq + 1);
    } catch (err) {
      console.error('Error calculando correlativo:', err);
      currentSeq = (config.sequences[serviceId] || 0) + 1;
    }

    if (isNaN(currentSeq) || currentSeq < 1) currentSeq = 1;
    config.sequences[serviceId] = currentSeq;

    setState(prev => ({
      ...prev,
      nextSequence: config
    }));

    supabase.from('system_config').upsert({ key: 'nextSequence', value: config }).then(({error}) => {
      if (error) console.error("Error al guardar nextSequence:", error);
    });

    const finalSeq = currentSeq;
    const code = `${service.prefix}${String(finalSeq).padStart(4, '0')}`;

    const { data, error } = await supabase.from('tickets').insert({
      code,
      service_id: serviceId,
      status: TicketStatus.WAITING,
      priority
    }).select().single();

    if (error) {
      console.error('Error creando turno:', error);
      return null;
    }

    const newTicket = mapTicketFromDb(data);

    // Actualizar el estado local de inmediato
    setState(prev => ({
      ...prev,
      tickets: [newTicket, ...prev.tickets.filter(t => t.id !== newTicket.id)]
    }));

    // Transmitir inmediatamente a todas las pantallas (Display, Operadores y Tótem)
    broadcastScreenEvent({
      type: 'TICKET_INSERT',
      ticket: newTicket
    });

    return newTicket;
  }, [state.services, state.nextSequence]);

  // Actualizar estado de un turno (Llamar, Atender, Completar, Cancelar)
  const updateTicketStatus = useCallback(async (ticketId: string, newStatus: TicketStatus, stationId: string) => {
    const ticket = state.tickets.find(t => t.id === ticketId);
    const station = state.stations.find(s => s.id === stationId);
    
    if (!ticket || !station) return;

    // Seguridad: Validar que el módulo atiende este servicio
    if (!station.serviceIds.includes(ticket.serviceId)) {
      alert('Este módulo no está autorizado para atender este servicio.');
      return;
    }

    // Validación: No permitir llamar a otro turno si ya hay uno activo en este módulo
    if (newStatus === TicketStatus.CALLING && ticket.id !== ticketId) {
      const hasActive = state.tickets.some(t => 
        t.stationId === stationId && 
        t.id !== ticketId &&
        (t.status === TicketStatus.CALLING || t.status === TicketStatus.ATTENDING)
      );
      if (hasActive) {
        alert('Ya tienes un ticket activo. Finalízalo antes de llamar a otro.');
        return;
      }
    }

    // Marcas de tiempo y datos a actualizar
    const nowIso = new Date().toISOString();
    const nowEpoch = Date.now();
    const updates: any = { status: newStatus };
    const updatedMetadata = { ...ticket.metadata };

    if (newStatus === TicketStatus.CALLING) {
      updates.called_at = nowIso;
      updates.station_id = stationId;
      updates.recalled_count = (ticket.metadata?.recalledCount || 0) + 1;
      updatedMetadata.recalledCount = updates.recalled_count;
    } else if (newStatus === TicketStatus.ATTENDING) {
      updates.started_at = nowIso;
      updates.station_id = stationId;
    } else if (newStatus === TicketStatus.COMPLETED || newStatus === TicketStatus.CANCELLED) {
      updates.ended_at = nowIso;
    }

    // 1. Actualización optimista instantánea (0 ms para que el operador no espere nada)
    const optimisticTicket: Ticket = {
      ...ticket,
      status: newStatus,
      stationId: updates.station_id || ticket.stationId,
      calledAt: updates.called_at ? nowEpoch : ticket.calledAt,
      startedAt: updates.started_at ? nowEpoch : ticket.startedAt,
      endedAt: updates.ended_at ? nowEpoch : ticket.endedAt,
      metadata: updatedMetadata
    };

    setState(prev => {
      const tickets = [...prev.tickets];
      const idx = tickets.findIndex(t => t.id === ticketId);
      if (idx !== -1) {
        tickets[idx] = optimisticTicket;
      } else {
        tickets.unshift(optimisticTicket);
      }
      return { ...prev, tickets };
    });

    // 2. Transmisión instantánea a pantallas (el display suena y actualiza de inmediato)
    broadcastScreenEvent({
      type: 'TICKET_UPDATE',
      ticket: optimisticTicket
    });

    // 3. Guardado en la base de datos Supabase
    try {
      const { data, error } = await supabase.from('tickets')
        .update(updates)
        .eq('id', ticketId)
        .select()
        .single();
        
      if (error) {
        console.error('Error actualizando turno en base de datos:', error);
      } else if (data) {
        const reconciled = mapTicketFromDb(data);
        setState(prev => {
          const tickets = [...prev.tickets];
          const idx = tickets.findIndex(t => t.id === ticketId);
          if (idx !== -1) {
            tickets[idx] = reconciled;
          }
          return { ...prev, tickets };
        });
        broadcastScreenEvent({
          type: 'TICKET_UPDATE',
          ticket: reconciled
        });
      }
    } catch (err) {
      console.error('Excepción al guardar turno en base de datos:', err);
    }
  }, [state.tickets, state.stations]);

  // Agregar nuevo usuario con actualización optimista inmediata
  const addUser = useCallback(async (u: Omit<User, 'id'>) => {
    const tempId = crypto.randomUUID ? crypto.randomUUID() : `usr_${Date.now()}`;
    const optimisticUser: User = { id: tempId, ...u };

    setState(prev => {
      // Si el nuevo usuario tiene módulo asignado, desvincular a cualquier otro usuario previo de ese módulo
      let users = prev.users;
      let stations = prev.stations;
      if (u.assignedStationId) {
        users = users.map(usr => usr.assignedStationId === u.assignedStationId ? { ...usr, assignedStationId: undefined } : usr);
        stations = prev.stations.map(st => st.id === u.assignedStationId ? { ...st, operatorName: u.name } : st);
      }
      return {
        ...prev,
        users: [...users, optimisticUser],
        stations
      };
    });
    broadcastScreenEvent({ type: 'USER_UPDATE', user: optimisticUser });
    if (u.assignedStationId) {
      broadcastScreenEvent({ type: 'STATION_UPDATE', station: { id: u.assignedStationId, operatorName: u.name } });
      supabase.from('stations').update({ operator_name: u.name }).eq('id', u.assignedStationId).then();
      // Desvincular cualquier usuario anterior que tuviera este módulo
      supabase.from('users').update({ assigned_station_id: null }).eq('assigned_station_id', u.assignedStationId).then();
    }

    const { data, error } = await supabase.from('users').insert({
      username: u.username,
      password: u.password,
      name: u.name,
      role: u.role,
      assigned_station_id: u.assignedStationId || null
    }).select().single();

    if (error) {
      console.error("Error al agregar usuario:", error);
      alert('Error al agregar el usuario en la base de datos.');
      fetchAll();
    } else if (data) {
      const realUser = mapUserFromDb(data);
      setState(prev => ({
        ...prev,
        users: prev.users.map(usr => usr.id === tempId ? realUser : usr)
      }));
      broadcastScreenEvent({ type: 'USER_UPDATE', user: realUser });
    }
  }, [fetchAll]);

  // Actualizar usuario con actualización optimista inmediata
  const updateUser = useCallback(async (id: string, u: Partial<User>) => {
    setState(prev => {
      // Si se asigna un módulo, desvincular a otros usuarios de ese mismo módulo
      const newStationId = u.assignedStationId;
      const users = prev.users.map(usr => {
        if (usr.id === id) {
          return { ...usr, ...u };
        }
        if (newStationId && usr.assignedStationId === newStationId) {
          return { ...usr, assignedStationId: undefined };
        }
        return usr;
      });

      let currentUser = prev.currentUser;
      if (currentUser && currentUser.id === id) {
        currentUser = { ...currentUser, ...u };
        try {
          localStorage.setItem('gesfil_user', JSON.stringify(currentUser));
        } catch (e) {}
      }

      // Sincronizar de inmediato el responsable del módulo
      let stations = prev.stations;
      if (u.assignedStationId !== undefined) {
        const currentAssigned = prev.users.find(usr => usr.id === id)?.assignedStationId;
        const opName = u.name || prev.users.find(usr => usr.id === id)?.name || '';

        stations = prev.stations.map(st => {
          if (newStationId && st.id === newStationId) {
            return { ...st, operatorName: opName };
          }
          if (currentAssigned && st.id === currentAssigned && currentAssigned !== newStationId) {
            return { ...st, operatorName: '' };
          }
          return st;
        });
      }

      return { ...prev, users, currentUser, stations };
    });
    broadcastScreenEvent({ type: 'USER_UPDATE', user: { id, ...u } });

    // Sincronizar en base de datos el nombre del operador en el módulo
    if (u.assignedStationId !== undefined) {
      const newStationId = u.assignedStationId;
      const targetUser = state.users.find(usr => usr.id === id);
      const opName = u.name || targetUser?.name || '';

      if (newStationId) {
        broadcastScreenEvent({ type: 'STATION_UPDATE', station: { id: newStationId, operatorName: opName } });
        supabase.from('stations').update({ operator_name: opName }).eq('id', newStationId).then();
        // Desvincular cualquier otro usuario de este módulo en la base de datos
        supabase.from('users').update({ assigned_station_id: null }).eq('assigned_station_id', newStationId).neq('id', id).then();
      }
      if (targetUser?.assignedStationId && targetUser.assignedStationId !== newStationId) {
        broadcastScreenEvent({ type: 'STATION_UPDATE', station: { id: targetUser.assignedStationId, operatorName: '' } });
        supabase.from('stations').update({ operator_name: '' }).eq('id', targetUser.assignedStationId).then();
      }
    }

    const updates: any = { ...u };
    if (u.assignedStationId !== undefined) {
      updates.assigned_station_id = u.assignedStationId || null;
    }
    if (u.role && u.role !== UserRole.STAFF) {
      updates.assigned_station_id = null;
    }
    delete updates.assignedStationId;
    delete updates.id;

    const { data, error } = await supabase.from('users').update(updates).eq('id', id).select().single();
    if (error) {
      console.error("Error al actualizar usuario:", error);
      alert('Error al actualizar el usuario.');
      fetchAll();
    } else if (data) {
      const realUser = mapUserFromDb(data);
      setState(prev => ({
        ...prev,
        users: prev.users.map(usr => usr.id === id ? realUser : usr),
        currentUser: prev.currentUser?.id === id ? realUser : prev.currentUser
      }));
      broadcastScreenEvent({ type: 'USER_UPDATE', user: realUser });
    }
  }, [fetchAll, state.users]);

  // Eliminar usuario con actualización optimista inmediata
  const deleteUser = useCallback(async (id: string) => {
    setState(prev => ({
      ...prev,
      users: prev.users.filter(u => u.id !== id),
      currentUser: prev.currentUser?.id === id ? null : prev.currentUser
    }));
    broadcastScreenEvent({ type: 'USER_DELETE', id });

    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) {
      console.error("Error al eliminar usuario:", error);
      alert('Error al eliminar usuario.');
      fetchAll();
    }
  }, [fetchAll]);

  // Agregar servicio con actualización optimista inmediata
  const addService = useCallback(async (s: Omit<Service, 'id'>) => {
    const tempId = crypto.randomUUID ? crypto.randomUUID() : `srv_${Date.now()}`;
    const optimisticService: Service = { id: tempId, ...s };

    setState(prev => ({
      ...prev,
      services: [...prev.services, optimisticService]
    }));
    broadcastScreenEvent({ type: 'SERVICE_UPDATE', service: optimisticService });

    const { data, error } = await supabase.from('services').insert({
      name: s.name,
      prefix: s.prefix,
      color: s.color,
      description: s.description,
      active: s.active
    }).select().single();

    if (error) {
      console.error("Error al agregar servicio:", error);
      alert('Error al agregar el servicio en la base de datos.');
      fetchAll();
    } else if (data) {
      const realService = mapServiceFromDb(data);
      setState(prev => ({
        ...prev,
        services: prev.services.map(srv => srv.id === tempId ? realService : srv)
      }));
      broadcastScreenEvent({ type: 'SERVICE_UPDATE', service: realService });
    }
  }, [fetchAll]);

  // Actualizar servicio con actualización optimista inmediata
  const updateService = useCallback(async (id: string, s: Partial<Service>) => {
    setState(prev => {
      const services = prev.services.map(srv => srv.id === id ? { ...srv, ...s } : srv);
      return { ...prev, services };
    });
    broadcastScreenEvent({ type: 'SERVICE_UPDATE', service: { id, ...s } });

    const updates: any = { ...s };
    delete updates.id;

    const { data, error } = await supabase.from('services').update(updates).eq('id', id).select().single();
    if (error) {
      console.error("Error al actualizar servicio:", error);
      alert('Error al actualizar el servicio en la base de datos.');
      fetchAll();
    } else if (data) {
      const realService = mapServiceFromDb(data);
      setState(prev => ({
        ...prev,
        services: prev.services.map(srv => srv.id === id ? realService : srv)
      }));
      broadcastScreenEvent({ type: 'SERVICE_UPDATE', service: realService });
    }
  }, [fetchAll]);

  // Eliminar servicio con actualización optimista inmediata
  const deleteService = useCallback(async (id: string) => {
    const { count, error: countErr } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('service_id', id);
    if (!countErr && count && count > 0) {
      alert(`No se puede eliminar este servicio porque tiene ${count} turnos asociados en el historial. Puede desactivarlo en su lugar.`);
      return;
    }

    setState(prev => ({
      ...prev,
      services: prev.services.filter(s => s.id !== id)
    }));
    broadcastScreenEvent({ type: 'SERVICE_DELETE', id });

    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) {
      console.error("Error al eliminar servicio:", error);
      alert('Error al eliminar el servicio. Verifique que no existan registros dependientes.');
      fetchAll();
    }
  }, [fetchAll]);

  // Agregar módulo de atención con actualización optimista inmediata
  const addStation = useCallback(async (s: Omit<Station, 'id'>) => {
    const tempId = crypto.randomUUID ? crypto.randomUUID() : `stn_${Date.now()}`;
    const optimisticStation: Station = { id: tempId, ...s };

    setState(prev => ({
      ...prev,
      stations: [...prev.stations, optimisticStation]
    }));
    broadcastScreenEvent({ type: 'STATION_UPDATE', station: optimisticStation });

    const { data, error } = await supabase.from('stations').insert({
      name: s.name,
      operator_name: s.operatorName,
      service_ids: s.serviceIds,
      service_configs: s.serviceConfigs || {},
      active: s.active
    }).select().single();

    if (error) {
      console.error('Error al agregar módulo:', error);
      alert('Error al agregar el módulo.');
      fetchAll();
    } else if (data) {
      const realStation = mapStationFromDb(data);
      setState(prev => ({
        ...prev,
        stations: prev.stations.map(st => st.id === tempId ? realStation : st)
      }));
      broadcastScreenEvent({ type: 'STATION_UPDATE', station: realStation });
    }
  }, [fetchAll]);

  // Actualizar módulo de atención con actualización optimista inmediata
  const updateStation = useCallback(async (id: string, s: Partial<Station>) => {
    setState(prev => {
      const stations = prev.stations.map(st => st.id === id ? { ...st, ...s } : st);
      // Sincronizar usuario correspondiente si se modificó el nombre del operador
      let users = prev.users;
      let currentUser = prev.currentUser;
      if (s.operatorName !== undefined) {
        users = prev.users.map(u => {
          if (u.role === UserRole.STAFF) {
            if (s.operatorName && u.name.toLowerCase() === s.operatorName.toLowerCase()) {
              return { ...u, assignedStationId: id };
            }
            if (u.assignedStationId === id && (!s.operatorName || u.name.toLowerCase() !== s.operatorName.toLowerCase())) {
              return { ...u, assignedStationId: undefined };
            }
          }
          return u;
        });

        if (currentUser && currentUser.role === UserRole.STAFF) {
          const fresh = users.find(u => u.id === currentUser!.id);
          if (fresh) currentUser = fresh;
        }
      }
      return { ...prev, stations, users, currentUser };
    });
    broadcastScreenEvent({ type: 'STATION_UPDATE', station: { id, ...s } });

    // Sincronizar en base de datos la vinculación de usuario si cambió el operador
    if (s.operatorName !== undefined) {
      if (!s.operatorName.trim()) {
        supabase.from('users').update({ assigned_station_id: null }).eq('assigned_station_id', id).then();
      } else {
        const matchingUser = state.users.find(u => u.name.toLowerCase() === s.operatorName!.toLowerCase() && u.role === UserRole.STAFF);
        if (matchingUser) {
          supabase.from('users').update({ assigned_station_id: id }).eq('id', matchingUser.id).then();
          supabase.from('users').update({ assigned_station_id: null }).eq('assigned_station_id', id).neq('id', matchingUser.id).then();
        }
      }
    }

    const updates: any = {};
    if (s.name !== undefined) updates.name = s.name;
    if (s.operatorName !== undefined) updates.operator_name = s.operatorName;
    if (s.serviceIds !== undefined) updates.service_ids = s.serviceIds;
    if (s.serviceConfigs !== undefined) updates.service_configs = s.serviceConfigs;
    if (s.active !== undefined) updates.active = s.active;

    const { data, error } = await supabase.from('stations').update(updates).eq('id', id).select().single();
    if (error) {
      console.error('Error al actualizar módulo:', error);
      alert('Error al actualizar el módulo.');
      fetchAll();
    } else if (data) {
      const realStation = mapStationFromDb(data);
      setState(prev => ({
        ...prev,
        stations: prev.stations.map(st => st.id === id ? realStation : st)
      }));
      broadcastScreenEvent({ type: 'STATION_UPDATE', station: realStation });
    }
  }, [fetchAll, state.users]);

  // Eliminar módulo de atención con actualización optimista inmediata
  const deleteStation = useCallback(async (id: string) => {
    const { count, error: countErr } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('station_id', id);
    if (!countErr && count && count > 0) {
      alert(`No se puede eliminar este módulo porque tiene ${count} turnos atendidos asociados. Puede desactivarlo en su lugar.`);
      return;
    }

    setState(prev => ({
      ...prev,
      stations: prev.stations.filter(st => st.id !== id),
      users: prev.users.map(u => u.assignedStationId === id ? { ...u, assignedStationId: undefined } : u),
      currentUser: prev.currentUser?.assignedStationId === id ? { ...prev.currentUser, assignedStationId: undefined } : prev.currentUser
    }));
    broadcastScreenEvent({ type: 'STATION_DELETE', id });
    supabase.from('users').update({ assigned_station_id: null }).eq('assigned_station_id', id).then();

    const { error } = await supabase.from('stations').delete().eq('id', id);
    if (error) {
      console.error("Error al eliminar módulo:", error);
      alert('Error al eliminar el módulo. Verifique dependencias.');
      fetchAll();
    }
  }, [fetchAll]);

  // Agregar impresora con actualización optimista inmediata
  const addPrinter = useCallback(async (pr: Omit<Printer, 'id'>) => {
    const tempId = crypto.randomUUID ? crypto.randomUUID() : `prn_${Date.now()}`;
    const optimisticPrinter: Printer = { id: tempId, ...pr };

    setState(prev => ({
      ...prev,
      printers: [...prev.printers, optimisticPrinter]
    }));
    broadcastScreenEvent({ type: 'PRINTER_UPDATE', printer: optimisticPrinter });

    const { data, error } = await supabase.from('printers').insert(pr).select().single();
    if (error) {
      console.error("Error al agregar impresora:", error);
      fetchAll();
    } else if (data) {
      const realPrinter = mapPrinterFromDb(data);
      setState(prev => ({
        ...prev,
        printers: prev.printers.map(p => p.id === tempId ? realPrinter : p)
      }));
      broadcastScreenEvent({ type: 'PRINTER_UPDATE', printer: realPrinter });
    }
  }, [fetchAll]);

  // Actualizar impresora con actualización optimista inmediata
  const updatePrinter = useCallback(async (id: string, pr: Partial<Printer>) => {
    setState(prev => {
      const printers = prev.printers.map(p => p.id === id ? { ...p, ...pr } : p);
      return { ...prev, printers };
    });
    broadcastScreenEvent({ type: 'PRINTER_UPDATE', printer: { id, ...pr } });

    const updates: any = { ...pr };
    delete updates.id;
    const { data, error } = await supabase.from('printers').update(updates).eq('id', id).select().single();
    if (error) {
      console.error("Error al actualizar impresora:", error);
      fetchAll();
    } else if (data) {
      const realPrinter = mapPrinterFromDb(data);
      setState(prev => ({
        ...prev,
        printers: prev.printers.map(p => p.id === id ? realPrinter : p)
      }));
      broadcastScreenEvent({ type: 'PRINTER_UPDATE', printer: realPrinter });
    }
  }, [fetchAll]);

  // Eliminar impresora con actualización optimista inmediata
  const deletePrinter = useCallback(async (id: string) => {
    setState(prev => ({
      ...prev,
      printers: prev.printers.filter(p => p.id !== id)
    }));
    broadcastScreenEvent({ type: 'PRINTER_DELETE', id });

    const { error } = await supabase.from('printers').delete().eq('id', id);
    if (error) {
      console.error("Error al eliminar impresora:", error);
      fetchAll();
    }
  }, [fetchAll]);

  // Purgar y reiniciar el sistema
  const resetSystem = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Reinicio optimista inmediato en memoria y aviso a todas las pantallas
      setState(prev => ({
        ...prev,
        tickets: [],
        nextSequence: { lastResetDate: today, sequences: {} }
      }));

      broadcastScreenEvent({
        type: 'SYSTEM_RESET'
      });

      const { error: deleteError } = await supabase
        .from('tickets')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
        
      if (deleteError) {
        console.error('Error al purgar turnos:', deleteError);
        throw deleteError;
      }
      
      await supabase.from('system_config').upsert({ key: 'nextSequence', value: { lastResetDate: today, sequences: {} } });
      
      alert('Sistema purgado correctamente. Los turnos han sido reiniciados.');
    } catch (error) {
      console.error('Error al purgar el sistema:', error);
      alert('Error al purgar el sistema.');
    }
  }, []);

  // Verificar si un servicio se encuentra activo según horarios
  const isServiceActive = useCallback((service: Service, station?: Station) => {
    if (!service.active) return false;
    
    if (station && station.serviceConfigs && station.serviceConfigs[service.id]) {
      const config = station.serviceConfigs[service.id];
      const startTime = config.startTime?.trim();
      const endTime = config.endTime?.trim();

      if (startTime || endTime) {
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        if (startTime && endTime) {
          if (startTime <= endTime) {
            // Horario habitual durante el mismo día (ej. 08:00 a 18:00)
            if (currentTime < startTime || currentTime > endTime) return false;
          } else {
            // Horario nocturno que cruza la medianoche (ej. 22:00 a 06:00)
            if (currentTime < startTime && currentTime > endTime) return false;
          }
        } else if (startTime && !endTime) {
          if (currentTime < startTime) return false;
        } else if (!startTime && endTime) {
          if (currentTime > endTime) return false;
        }
      }
    }
    
    return true;
  }, []);

  // Actualizar configuración del display (sonido, volumen, duración)
  const updateDisplaySettings = useCallback(async (settings: { notificationSound: string; notificationVolume?: number; notificationDuration?: number }) => {
    setState(prev => ({ ...prev, displaySettings: settings }));
    broadcastScreenEvent({ type: 'SETTINGS_UPDATE', settings });
    const { error } = await supabase.from('system_config').upsert({ key: 'displaySettings', value: settings });
    if (error) console.error("Error al guardar ajustes de pantalla:", error);
  }, []);

  // Inicializar base de datos con datos por defecto
  const seedDatabase = useCallback(async () => {
    setLoading(true);
    try {
      const { error: err1 } = await supabase.from('tickets').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (err1) throw err1;
      const { error: err2 } = await supabase.from('stations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (err2) throw err2;
      const { error: err3 } = await supabase.from('services').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (err3) throw err3;
      const { error: err4 } = await supabase.from('users').delete().neq('username', 'superadmin');
      if (err4) throw err4;

      const { error: err5 } = await supabase.from('services').insert(INITIAL_SERVICES.map(s => ({
        id: s.id,
        name: s.name,
        prefix: s.prefix,
        color: s.color,
        description: s.description,
        active: s.active
      })));
      if (err5) throw err5;

      const { error: err6 } = await supabase.from('stations').insert(INITIAL_STATIONS.map(s => ({
        id: s.id,
        name: s.name,
        operator_name: s.operatorName,
        service_ids: s.serviceIds,
        active: s.active
      })));
      if (err6) throw err6;

      const { error: err7 } = await supabase.from('users').upsert(DEFAULT_USERS.map(u => ({
        id: u.id,
        username: u.username,
        password: u.password,
        name: u.name,
        role: u.role,
        assigned_station_id: u.assignedStationId || null
      })));
      if (err7) throw err7;

      const today = new Date().toISOString().split('T')[0];
      const { error: err8 } = await supabase.from('system_config').upsert({ key: 'nextSequence', value: { lastResetDate: today, sequences: {} } });
      if (err8) throw err8;

      broadcastScreenEvent({ type: 'FULL_REFRESH' });
      alert('Base de datos inicializada con éxito en Supabase.');
    } catch (error) {
      console.error('Error al inicializar base de datos:', error);
      alert('Error al inicializar la base de datos.');
    } finally {
      setLoading(false);
    }
  }, []);

  return { 
    state, loading, login, logout, addTicket, updateTicketStatus, resetSystem, seedDatabase,
    addUser, updateUser, deleteUser, addService, updateService, deleteService, 
    addStation, updateStation, deleteStation, isServiceActive,
    addPrinter, updatePrinter, deletePrinter, updateDisplaySettings,
    isInitialized: state.users.length > 0
  };
};
