'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, clearSession } from '@/lib/store';
import { Scissors, CalendarDays, TrendingUp, Users, LogOut } from 'lucide-react';
import CalendarTab from '@/components/CalendarTab';
import FinanceTab from '@/components/FinanceTab';
import BarbersTab from '@/components/BarbersTab';

const TABS = [
  { id: 'calendar', label: 'Calendario', icon: CalendarDays },
  { id: 'finance', label: 'Económico', icon: TrendingUp },
  { id: 'barbers', label: 'Barberos', icon: Users },
];

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSessionState] = useState<{ shopId: string; shopName: string } | null>(null);
  const [activeTab, setActiveTab] = useState('calendar');

  useEffect(() => {
    const s = getSession();
    if (!s) { router.push('/'); return; }
    setSessionState(s);
  }, [router]);

  const handleLogout = () => {
    clearSession();
    router.push('/');
  };

  if (!session) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 60, position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, var(--gold-dark), var(--gold))',
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Scissors size={18} color="#0a0a0a" />
          </div>
          <div>
            <span className="font-display gold-gradient" style={{ fontSize: 18, fontWeight: 900 }}>BarberOS</span>
            <span style={{ color: 'var(--text-dim)', fontSize: 12, marginLeft: 10 }}>{session.shopName}</span>
          </div>
        </div>

        {/* Tabs */}
        <nav style={{ display: 'flex', gap: 4 }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: active ? 'rgba(201,168,76,0.12)' : 'transparent',
                color: active ? 'var(--gold)' : 'var(--text-muted)',
                fontSize: 14, fontWeight: active ? 600 : 400,
                transition: 'all 0.15s',
              }}>
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <button onClick={handleLogout} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: '1px solid var(--border2)',
          borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
          color: 'var(--text-muted)', fontSize: 13, transition: 'all 0.15s',
        }}
          onMouseEnter={e => { (e.target as HTMLElement).closest('button')!.style.borderColor = 'var(--red)'; (e.target as HTMLElement).closest('button')!.style.color = '#e74c3c'; }}
          onMouseLeave={e => { (e.target as HTMLElement).closest('button')!.style.borderColor = 'var(--border2)'; (e.target as HTMLElement).closest('button')!.style.color = 'var(--text-muted)'; }}
        >
          <LogOut size={14} />
          Salir
        </button>
      </header>

      {/* Content */}
      <main style={{ flex: 1, padding: '24px', maxWidth: 1400, width: '100%', margin: '0 auto' }}>
        {activeTab === 'calendar' && <CalendarTab shopId={session.shopId} />}
        {activeTab === 'finance' && <FinanceTab shopId={session.shopId} />}
        {activeTab === 'barbers' && <BarbersTab shopId={session.shopId} />}
      </main>
    </div>
  );
}
