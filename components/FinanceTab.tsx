'use client';
import { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, X, Banknote, CreditCard, TrendingUp, Euro } from 'lucide-react';
import { getBarbers, getTransactions, saveTransactions, Transaction, Barber, SERVICE_TYPES, ServiceType, genId } from '@/lib/store';

export default function FinanceTab({ shopId }: { shopId: string }) {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    barberId: '', service: 'Corte de pelo' as ServiceType,
    price: '', paymentMethod: 'cash' as 'cash' | 'card',
    clientName: '', date: format(new Date(), 'yyyy-MM-dd'), notes: '',
  });

  useEffect(() => {
    setBarbers(getBarbers(shopId));
    setTransactions(getTransactions(shopId));
  }, [shopId]);

  const addTransaction = () => {
    if (!form.barberId || !form.price) return;
    const t: Transaction = {
      id: genId(),
      barberId: form.barberId,
      service: form.service,
      price: parseFloat(form.price),
      paymentMethod: form.paymentMethod,
      date: form.date,
      clientName: form.clientName,
      notes: form.notes,
    };
    const updated = [t, ...transactions];
    setTransactions(updated);
    saveTransactions(shopId, updated);
    setShowModal(false);
    setForm({ barberId: barbers[0]?.id || '', service: 'Corte de pelo', price: '', paymentMethod: 'cash', clientName: '', date: format(new Date(), 'yyyy-MM-dd'), notes: '' });
  };

  const deleteTransaction = (id: string) => {
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    saveTransactions(shopId, updated);
  };

  const openModal = () => {
    setForm({ barberId: barbers[0]?.id || '', service: 'Corte de pelo', price: '', paymentMethod: 'cash', clientName: '', date: format(new Date(), 'yyyy-MM-dd'), notes: '' });
    setShowModal(true);
  };

  const getBarber = (id: string) => barbers.find(b => b.id === id);

  // Summary calcs
  const calcSummary = (txs: Transaction[]) => ({
    cash: txs.filter(t => t.paymentMethod === 'cash').reduce((s, t) => s + t.price, 0),
    card: txs.filter(t => t.paymentMethod === 'card').reduce((s, t) => s + t.price, 0),
    total: txs.reduce((s, t) => s + t.price, 0),
    count: txs.length,
  });

  const now = new Date();
  const weekTxs = transactions.filter(t => isWithinInterval(parseISO(t.date), { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }));
  const monthTxs = transactions.filter(t => isWithinInterval(parseISO(t.date), { start: startOfMonth(now), end: endOfMonth(now) }));

  const weekSummary = calcSummary(weekTxs);
  const monthSummary = calcSummary(monthTxs);

  const fmt = (n: number) => n.toFixed(2).replace('.', ',') + ' €';

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 className="font-display" style={{ fontSize: 24, fontWeight: 700 }}>Económico</h2>
        <button onClick={openModal} className="btn-gold" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, fontSize: 14 }}>
          <Plus size={16} /> Registrar servicio
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, marginBottom: 28 }}>
        {/* Weekly */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <TrendingUp size={18} color="var(--gold)" />
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>ESTA SEMANA</h3>
            <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 'auto' }}>{weekSummary.count} servicios</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <SummaryCell icon={<Banknote size={14} />} label="Metálico" value={fmt(weekSummary.cash)} color="#4cd68a" />
            <SummaryCell icon={<CreditCard size={14} />} label="Tarjeta" value={fmt(weekSummary.card)} color="#5dade2" />
            <SummaryCell icon={<Euro size={14} />} label="Total" value={fmt(weekSummary.total)} color="var(--gold)" bold />
          </div>
        </div>
        {/* Monthly */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <TrendingUp size={18} color="var(--gold)" />
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>ESTE MES</h3>
            <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 'auto' }}>{monthSummary.count} servicios</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <SummaryCell icon={<Banknote size={14} />} label="Metálico" value={fmt(monthSummary.cash)} color="#4cd68a" />
            <SummaryCell icon={<CreditCard size={14} />} label="Tarjeta" value={fmt(monthSummary.card)} color="#5dade2" />
            <SummaryCell icon={<Euro size={14} />} label="Total" value={fmt(monthSummary.total)} color="var(--gold)" bold />
          </div>
        </div>
      </div>

      {/* Transactions list */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600 }}>Historial de servicios</h3>
          <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{transactions.length} registros</span>
        </div>
        {transactions.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-dim)' }}>
            <Euro size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ fontSize: 14 }}>No hay servicios registrados</p>
          </div>
        ) : (
          <div style={{ maxHeight: 450, overflowY: 'auto' }}>
            {/* Table header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '120px 1fr 130px 100px 100px 80px 36px',
              padding: '10px 20px', borderBottom: '1px solid var(--border)',
              fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              <span>Fecha</span><span>Servicio / Cliente</span><span>Barbero</span>
              <span>Pago</span><span style={{ textAlign: 'right' }}>Precio</span><span></span><span></span>
            </div>
            {transactions.map(t => {
              const barber = getBarber(t.barberId);
              return (
                <div key={t.id} style={{
                  display: 'grid', gridTemplateColumns: '120px 1fr 130px 100px 100px 80px 36px',
                  padding: '12px 20px', borderBottom: '1px solid var(--border)',
                  alignItems: 'center', transition: 'background 0.1s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {format(parseISO(t.date), "d MMM yyyy", { locale: es })}
                  </span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{t.service}</div>
                    {t.clientName && <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{t.clientName}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: barber?.color || '#888', flexShrink: 0 }} />
                    <span style={{ fontSize: 13 }}>{barber?.name || '—'}</span>
                  </div>
                  <div>
                    <span style={{
                      fontSize: 11, padding: '3px 8px', borderRadius: 4, fontWeight: 600,
                      ...(t.paymentMethod === 'cash'
                        ? { background: 'rgba(39,174,96,0.1)', color: '#4cd68a', border: '1px solid rgba(39,174,96,0.2)' }
                        : { background: 'rgba(41,128,185,0.1)', color: '#5dade2', border: '1px solid rgba(41,128,185,0.2)' }),
                    }}>
                      {t.paymentMethod === 'cash' ? '💵 Metálico' : '💳 Tarjeta'}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 15, fontWeight: 700, color: 'var(--gold)' }}>
                    {fmt(t.price)}
                  </div>
                  <div />
                  <button onClick={() => deleteTransaction(t.id)} style={{
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)',
                    padding: 4, borderRadius: 4, transition: 'color 0.15s',
                  }}
                    onMouseEnter={e => ((e.target as HTMLElement).style.color = '#e74c3c')}
                    onMouseLeave={e => ((e.target as HTMLElement).style.color = 'var(--text-dim)')}
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowModal(false)}>
          <div className="animate-in" onClick={e => e.stopPropagation()} style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, width: 440,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 className="font-display" style={{ fontSize: 20, fontWeight: 700 }}>Registrar Servicio</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tipo de servicio</label>
                <select className="input-dark" value={form.service} onChange={e => setForm({ ...form, service: e.target.value as ServiceType })}>
                  {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Precio (€)</label>
                  <input className="input-dark" type="number" step="0.5" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="15,00" />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha</label>
                  <input className="input-dark" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Método de pago</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {(['cash', 'card'] as const).map(method => (
                    <button key={method} type="button" onClick={() => setForm({ ...form, paymentMethod: method })}
                      style={{
                        padding: '12px', borderRadius: 8, cursor: 'pointer',
                        border: `2px solid ${form.paymentMethod === method ? (method === 'cash' ? '#27ae60' : '#2980b9') : 'var(--border2)'}`,
                        background: form.paymentMethod === method ? (method === 'cash' ? 'rgba(39,174,96,0.1)' : 'rgba(41,128,185,0.1)') : 'var(--surface2)',
                        color: form.paymentMethod === method ? (method === 'cash' ? '#4cd68a' : '#5dade2') : 'var(--text-muted)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, fontWeight: 500,
                        transition: 'all 0.15s',
                      }}>
                      {method === 'cash' ? <><Banknote size={18} /> Metálico</> : <><CreditCard size={18} /> Tarjeta</>}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Barbero</label>
                <select className="input-dark" value={form.barberId} onChange={e => setForm({ ...form, barberId: e.target.value })}>
                  {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cliente (opcional)</label>
                <input className="input-dark" value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} placeholder="Nombre del cliente" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setShowModal(false)} className="btn-ghost" style={{ flex: 1, padding: '11px', borderRadius: 8, fontSize: 14 }}>Cancelar</button>
              <button onClick={addTransaction} className="btn-gold" style={{ flex: 2, padding: '11px', borderRadius: 8, fontSize: 14 }}>Registrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCell({ icon, label, value, color, bold }: { icon: React.ReactNode; label: string; value: string; color: string; bold?: boolean }) {
  return (
    <div style={{ textAlign: 'center', padding: '12px 8px', background: 'var(--surface2)', borderRadius: 10 }}>
      <div style={{ color, marginBottom: 4, display: 'flex', justifyContent: 'center' }}>{icon}</div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: bold ? 18 : 16, fontWeight: bold ? 800 : 700, color }}>{value}</div>
    </div>
  );
}
