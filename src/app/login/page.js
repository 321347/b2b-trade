'use client';
import { useState, useEffect } from 'react';
import { sanitizeRedirect } from '@/lib/utils';

export default function Login() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('registered=1')) {
      setRegistered(true);
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const d = await r.json();
      if (d.ok) { localStorage.setItem('user', JSON.stringify(d.user)); localStorage.setItem('token', d.session?.access_token || ''); const redirect = sanitizeRedirect(localStorage.getItem('redirect')); localStorage.removeItem('redirect'); window.location.href = redirect; }
      else setError(d.error || 'Login failed');
    } catch { setError('网络错误，请重试'); }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 20 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, textAlign: 'center', marginBottom: 24, color: '#0f172a' }}>登录</h1>
      {registered && <div style={{ background: '#f0fdf4', color: '#16a34a', padding: 10, borderRadius: 6, marginBottom: 16, fontSize: 14 }}>注册成功，请登录</div>}
      {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: 10, borderRadius: 6, marginBottom: 16, fontSize: 14 }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="邮箱" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', fontSize: 14, marginBottom: 12, outline: 'none' }} />
        <input type="password" placeholder="密码" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', fontSize: 14, marginBottom: 16, outline: 'none' }} />
        <button type="submit" disabled={loading} style={{ width: '100%', padding: 12, borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.2)' }}>{loading ? '登录中...' : '登录'}</button>
      </form>
      <p style={{ textAlign: 'center', fontSize: 14, color: '#94a3b8', marginTop: 16 }}>还没有账号？<a href="/register" style={{ color: '#2563eb', fontWeight: 500 }}>注册</a> · <a href="/forgot-password" style={{ color: '#94a3b8' }}>忘记密码？</a></p>
    </div>
  );
}
