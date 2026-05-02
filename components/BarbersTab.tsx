'use client';
import { useState, useEffect } from 'react';
import { Plus, X, Phone, Scissors, Edit2, Check } from 'lucide-react';
import { getBarbers, saveBarbers, Barber, BARBER_COLORS, genId } from '@/lib/store';

export default function BarbersTab({ shopId }: { shopId: string }) {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', color: BARBER_COLORS[0] });

  useEffect(() => {
    setBarbers(getBarbers(shopId));
  }, [shopId]);

  const openAdd = () => {
    setEditId(null);
    setForm({ name: '', phone: '', color: BARBER_COLORS[barbers.length % BARBER_COLORS.length] });
    setShowModal(true);
  };

  const openEdit = (b: Barber) => {
    setEditId(b.id);
    setForm({ name: b.name, phone: b.phone || '', color: b.color });
    setShowModal(true);
  };

  const save = () => {
    if (!form.name.trim()) return;
    let updated: Barber[];
    if (editId) {
      updated = barbers.map(b => b.id === editId ? { ...b, ...form } : b);
    } else {
      updated = [...barbers, { id: genId(), ...form }];
    }
    setBarbers(updated);
    saveBarbers(shopId, updated);
    setShowModal(false);
  };

  const remove = (id: string) => {
    const updated = barbers.filter(b => b.id !== id);
    setBarbers(updated);
    saveBarbers(shopId, updated);
  };

  return (
    <div className="animate-in" style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 className="font-display" style={{ fontSize: 24, fontWeight: 700 }}>Barberos</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>{barbers.length} profesionales en plantilla</p>
        </div>
        <button onClick={openAdd} className="btn-gold" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, fontSize: 14 }}>
          <Plus size={16} /> Añadir barbero
        </button>
      </div>

      {barbers.length === 0 ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <Scissors size={48} style={{ margin: '0 auto 16px', color: 'var(--text-dim)', opacity: 0.4 }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>No hay barberos registrados</p>
          <button onClick={openAdd} className="btn-gold" style={{ marginTop: 16, padding: '10px 24px', borderRadius: 8, fontSize: 14 }}>
            Añadir primer barbero
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {barbers.map(b => (
            <div key={b.id} className="card" style={{ padding: 24, position: 'relative', transition: 'border-color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = b.color + '66')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                  background: `${b.color}22`, border: `2px solid ${b.color}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Scissors size={22} color={b.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{b.name}</h3>
                  {b.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13 }}>
                      <Phone size={13} />
                      {b.phone}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: b.color }} />
                    <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Color en calendario</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button onClick={() => openEdit(b)} style={{
                  flex: 1, padding: '8px', borderRadius: 7, border: '1px solid var(--border2)',
                  background: 'var(--surface2)', color: 'var(--text-muted)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13,
                  transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = b.color; e.currentTarget.style.color = b.color; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  <Edit2 size={13} /> Editar
                </button>
                <button onClick={() => remove(b.id)} style={{
                  padding: '8px 14px', borderRadius: 7, border: '1px solid var(--border2)',
                  background: 'var(--surface2)', color: 'var(--text-muted)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#c0392b'; e.currentTarget.style.color = '#e74c3c'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowModal(false)}>
          <div className="animate-in" onClick={e => e.stopPropagation()} style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, width: 400,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 className="font-display" style={{ fontSize: 20, fontWeight: 700 }}>{editId ? 'Editar Barbero' : 'Nuevo Barbero'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombre *</label>
                <input className="input-dark" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nombre del barbero" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Teléfono</label>
                <input className="input-dark" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="6XX XXX XXX" type="tel" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Color en calendario</label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {BARBER_COLORS.map(c => (
                    <button key={c} onClick={() => setForm({ ...form, color: c })} style={{
                      width: 36, height: 36, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                      outline: form.color === c ? `3px solid ${c}` : '3px solid transparent',
                      outlineOffset: 2, transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {form.color === c && <Check size={16} color="#fff" strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setShowModal(false)} className="btn-ghost" style={{ flex: 1, padding: '11px', borderRadius: 8, fontSize: 14 }}>Cancelar</button>
              <button onClick={save} className="btn-gold" style={{ flex: 2, padding: '11px', borderRadius: 8, fontSize: 14 }}>
                {editId ? 'Guardar cambios' : 'Añadir barbero'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
