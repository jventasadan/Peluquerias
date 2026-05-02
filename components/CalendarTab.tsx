'use client';
import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek,
  isSameDay, isSameMonth, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays,
  isToday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, X, Clock, User } from 'lucide-react';
import {
  getBarbers, getAppointments, saveAppointments,
  Appointment, Barber, SERVICE_TYPES, genId
} from '@/lib/store';

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8:00 - 20:00

export default function CalendarTab({ shopId }: { shopId: string }) {
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [form, setForm] = useState({
    clientName: '', service: 'Corte de pelo', barberId: '',
    date: '', time: '10:00', duration: 30, notes: '',
  });

  useEffect(() => {
    setBarbers(getBarbers(shopId));
    setAppointments(getAppointments(shopId));
  }, [shopId]);

  const openModal = (date?: string, time?: string) => {
    const b = barbers[0];
    setForm({
      clientName: '', service: 'Corte de pelo',
      barberId: b?.id || '',
      date: date || format(currentDate, 'yyyy-MM-dd'),
      time: time || '10:00',
      duration: 30, notes: '',
    });
    setShowModal(true);
  };

  const saveAppointment = () => {
    if (!form.clientName || !form.barberId || !form.date) return;
    const apt: Appointment = {
      id: genId(),
      ...form,
    };
    const updated = [...appointments, apt];
    setAppointments(updated);
    saveAppointments(shopId, updated);
    setShowModal(false);
  };

  const deleteAppointment = (id: string) => {
    const updated = appointments.filter(a => a.id !== id);
    setAppointments(updated);
    saveAppointments(shopId, updated);
  };

  const getBarber = (id: string) => barbers.find(b => b.id === id);

  const navigate = (dir: 1 | -1) => {
    if (view === 'day') setCurrentDate(dir === 1 ? addDays(currentDate, 1) : subDays(currentDate, 1));
    else if (view === 'week') setCurrentDate(dir === 1 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    else setCurrentDate(dir === 1 ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
  };

  const aptsForDay = (date: Date) =>
    appointments.filter(a => isSameDay(parseISO(a.date), date))
      .sort((a, b) => a.time.localeCompare(b.time));

  // Week days
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Month days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const monthDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const viewLabel = () => {
    if (view === 'day') return format(currentDate, "EEEE d 'de' MMMM yyyy", { locale: es });
    if (view === 'week') return `${format(weekDays[0], 'd MMM', { locale: es })} — ${format(weekDays[6], 'd MMM yyyy', { locale: es })}`;
    return format(currentDate, 'MMMM yyyy', { locale: es });
  };

  return (
    <div className="animate-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h2 className="font-display" style={{ fontSize: 24, fontWeight: 700 }}>Calendario</h2>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['day', 'week', 'month'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: view === v ? 'rgba(201,168,76,0.15)' : 'var(--surface2)',
                color: view === v ? 'var(--gold)' : 'var(--text-muted)',
                fontSize: 13, fontWeight: view === v ? 600 : 400,
                transition: 'all 0.15s',
              }}>
                {v === 'day' ? 'Día' : v === 'week' ? 'Semana' : 'Mes'}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => navigate(-1)} className="btn-ghost" style={{ padding: '6px', borderRadius: 6 }}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: 14, color: 'var(--text)', minWidth: 200, textAlign: 'center', textTransform: 'capitalize' }}>{viewLabel()}</span>
            <button onClick={() => navigate(1)} className="btn-ghost" style={{ padding: '6px', borderRadius: 6 }}>
              <ChevronRight size={16} />
            </button>
            <button onClick={() => setCurrentDate(new Date())} style={{
              padding: '5px 10px', background: 'var(--surface2)', border: '1px solid var(--border2)',
              borderRadius: 6, color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer',
            }}>Hoy</button>
          </div>
          <button onClick={() => openModal()} className="btn-gold" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, fontSize: 14 }}>
            <Plus size={16} /> Nueva cita
          </button>
        </div>
      </div>

      {/* Legend */}
      {barbers.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          {barbers.map(b => (
            <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: b.color }} />
              {b.name}
            </div>
          ))}
        </div>
      )}

      {/* Calendar views */}
      {view === 'month' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          {/* Days header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
              <div key={d} style={{ padding: '10px', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {monthDays.map(day => {
              const dayApts = aptsForDay(day);
              const inMonth = isSameMonth(day, currentDate);
              return (
                <div key={day.toISOString()} onClick={() => { setCurrentDate(day); setView('day'); }}
                  style={{
                    minHeight: 100, padding: '8px', borderRight: '1px solid var(--border)',
                    borderBottom: '1px solid var(--border)',
                    background: isToday(day) ? 'rgba(201,168,76,0.05)' : 'transparent',
                    cursor: 'pointer', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = isToday(day) ? 'rgba(201,168,76,0.05)' : 'transparent')}
                >
                  <div style={{
                    fontSize: 13, fontWeight: isToday(day) ? 700 : 400,
                    color: isToday(day) ? 'var(--gold)' : inMonth ? 'var(--text)' : 'var(--text-dim)',
                    width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '50%',
                    background: isToday(day) ? 'rgba(201,168,76,0.2)' : 'transparent',
                    marginBottom: 4,
                  }}>{format(day, 'd')}</div>
                  {dayApts.slice(0, 3).map(apt => {
                    const barber = getBarber(apt.barberId);
                    return (
                      <div key={apt.id} style={{
                        fontSize: 11, padding: '2px 6px', borderRadius: 4, marginBottom: 2,
                        background: `${barber?.color || '#888'}22`,
                        borderLeft: `2px solid ${barber?.color || '#888'}`,
                        color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {apt.time} {apt.clientName}
                      </div>
                    );
                  })}
                  {dayApts.length > 3 && <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>+{dayApts.length - 3} más</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'week' && (
        <div className="card" style={{ overflow: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', minWidth: 700 }}>
            {/* Header */}
            <div style={{ borderBottom: '1px solid var(--border)' }} />
            {weekDays.map(day => (
              <div key={day.toISOString()} style={{
                padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid var(--border)',
                borderLeft: '1px solid var(--border)',
              }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {format(day, 'EEE', { locale: es })}
                </div>
                <div style={{
                  fontSize: 18, fontWeight: 700,
                  color: isToday(day) ? 'var(--gold)' : 'var(--text)',
                  width: 32, height: 32, borderRadius: '50%', margin: '4px auto 0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isToday(day) ? 'rgba(201,168,76,0.15)' : 'transparent',
                }}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
            {/* Time slots */}
            {HOURS.map(hour => (
              <>
                <div key={`h${hour}`} style={{
                  padding: '8px 4px', textAlign: 'right', fontSize: 11, color: 'var(--text-dim)',
                  borderBottom: '1px solid var(--border)', paddingTop: 4,
                }}>
                  {hour}:00
                </div>
                {weekDays.map(day => {
                  const slotApts = aptsForDay(day).filter(a => parseInt(a.time) === hour);
                  return (
                    <div key={`${day.toISOString()}-${hour}`}
                      onClick={() => openModal(format(day, 'yyyy-MM-dd'), `${hour.toString().padStart(2, '0')}:00`)}
                      style={{
                        borderLeft: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
                        minHeight: 56, padding: 4, cursor: 'pointer', position: 'relative',
                        background: isToday(day) ? 'rgba(201,168,76,0.02)' : 'transparent',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = isToday(day) ? 'rgba(201,168,76,0.02)' : 'transparent')}
                    >
                      {slotApts.map(apt => {
                        const barber = getBarber(apt.barberId);
                        return (
                          <div key={apt.id}
                            onClick={e => { e.stopPropagation(); deleteAppointment(apt.id); }}
                            title="Click para eliminar"
                            style={{
                              fontSize: 11, padding: '3px 6px', borderRadius: 4,
                              background: `${barber?.color || '#888'}20`,
                              borderLeft: `3px solid ${barber?.color || '#888'}`,
                              color: 'var(--text)', marginBottom: 2, cursor: 'pointer',
                            }}>
                            <span style={{ fontWeight: 600 }}>{apt.time}</span> {apt.clientName}
                            <div style={{ color: 'var(--text-dim)', fontSize: 10 }}>{apt.service}</div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>
      )}

      {view === 'day' && (
        <div className="card" style={{ overflow: 'auto' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, textTransform: 'capitalize' }}>
              {format(currentDate, "EEEE d 'de' MMMM", { locale: es })}
            </h3>
            {isToday(currentDate) && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(201,168,76,0.15)', color: 'var(--gold)', fontWeight: 600 }}>HOY</span>}
          </div>
          <div>
            {HOURS.map(hour => {
              const slotApts = aptsForDay(currentDate).filter(a => parseInt(a.time) === hour);
              return (
                <div key={hour} style={{ display: 'flex', borderBottom: '1px solid var(--border)', minHeight: 70 }}>
                  <div style={{ width: 60, padding: '10px 8px', fontSize: 12, color: 'var(--text-dim)', textAlign: 'right', flexShrink: 0 }}>{hour}:00</div>
                  <div
                    onClick={() => openModal(format(currentDate, 'yyyy-MM-dd'), `${hour.toString().padStart(2, '0')}:00`)}
                    style={{ flex: 1, padding: '6px 12px', cursor: 'pointer', borderLeft: '1px solid var(--border)', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {slotApts.map(apt => {
                      const barber = getBarber(apt.barberId);
                      return (
                        <div key={apt.id} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '8px 12px', borderRadius: 8, marginBottom: 4,
                          background: `${barber?.color || '#888'}15`,
                          borderLeft: `4px solid ${barber?.color || '#888'}`,
                        }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{apt.clientName}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 12, marginTop: 2 }}>
                              <span><Clock size={10} style={{ marginRight: 3 }} />{apt.time} · {apt.duration}min</span>
                              <span>{apt.service}</span>
                              <span style={{ color: barber?.color }}><User size={10} style={{ marginRight: 3 }} />{barber?.name}</span>
                            </div>
                          </div>
                          <button onClick={e => { e.stopPropagation(); deleteAppointment(apt.id); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 4 }}>
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setShowModal(false)}>
          <div className="animate-in" onClick={e => e.stopPropagation()} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: 32, width: 420,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 className="font-display" style={{ fontSize: 20, fontWeight: 700 }}>Nueva Cita</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cliente</label>
                <input className="input-dark" value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} placeholder="Nombre del cliente" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha</label>
                  <input className="input-dark" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hora</label>
                  <input className="input-dark" type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Servicio</label>
                <select className="input-dark" value={form.service} onChange={e => setForm({ ...form, service: e.target.value })}>
                  {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Barbero</label>
                <select className="input-dark" value={form.barberId} onChange={e => setForm({ ...form, barberId: e.target.value })}>
                  {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duración (min)</label>
                <select className="input-dark" value={form.duration} onChange={e => setForm({ ...form, duration: parseInt(e.target.value) })}>
                  {[15, 30, 45, 60, 90].map(d => <option key={d} value={d}>{d} minutos</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notas</label>
                <input className="input-dark" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notas opcionales..." />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setShowModal(false)} className="btn-ghost" style={{ flex: 1, padding: '11px', borderRadius: 8, fontSize: 14 }}>Cancelar</button>
              <button onClick={saveAppointment} className="btn-gold" style={{ flex: 2, padding: '11px', borderRadius: 8, fontSize: 14 }}>Guardar cita</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
