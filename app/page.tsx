'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, setSession } from '@/lib/store';
import { Scissors, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 600));
    const session = login(email, password);
    if (session) {
      setSession(session);
      router.push('/dashboard');
    } else {
      setError('Email o contraseña incorrectos');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(201,168,76,0.05) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(201,168,76,0.03) 0%, transparent 50%)',
      }} />
      <div className="animate-in" style={{
        width: 420, padding: '48px 40px',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 20, position: 'relative', zIndex: 1,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 64, height: 64,
            background: 'linear-gradient(135deg, var(--gold-dark), var(--gold))',
            borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', boxShadow: '0 8px 32px rgba(201,168,76,0.3)',
          }}>
            <Scissors size={28} color="#0a0a0a" />
          </div>
          <h1 className="font-display" style={{ fontSize: 32, fontWeight: 900, lineHeight: 1 }}>
            <span className="gold-gradient">BarberOS</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>Sistema de gestión para barberías</p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Email</label>
            <input className="input-dark" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="barberia@ejemplo.com" required />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input className="input-dark" type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {error && (
            <div style={{ background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)', borderRadius: 8, padding: '10px 14px', color: '#e74c3c', fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}
          <button type="submit" className="btn-gold" disabled={loading} style={{ width: '100%', padding: '13px', borderRadius: 10, fontSize: 15, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Accediendo...' : 'Entrar →'}
          </button>
        </form>

        <div style={{ marginTop: 32, padding: '16px', background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cuentas demo</p>
          {[
            { email: 'barberia1@demo.com', name: 'The Classic Barber Shop' },
            { email: 'barberia2@demo.com', name: 'Modern Cuts Studio' },
          ].map(s => (
            <button key={s.email} onClick={() => { setEmail(s.email); setPassword('demo123'); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '4px 0', display: 'block' }}>
              <span style={{ color: 'var(--gold)', fontSize: 12 }}>{s.name}</span>
              <span style={{ color: 'var(--text-dim)', fontSize: 11 }}> · pass: demo123</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
