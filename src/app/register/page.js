'use client';
import { useState } from 'react';

export default function Register() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [name, setName] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const r = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, name }) });
      const d = await r.json();
      if (d.ok) window.location.href = '/login?registered=1';
      else setError(d.error || 'Registration failed');
    } catch { setError('网络错误，请重试'); }
    setLoading(false);
  }

  const inputStyle = { width: '100%', padding: 12, borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', fontSize: 14, marginBottom: 12, outline: 'none' };

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 20 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, textAlign: 'center', marginBottom: 24, color: '#0f172a' }}>注册</h1>
      {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: 10, borderRadius: 6, marginBottom: 16, fontSize: 14 }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="姓名（选填）" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
        <input type="email" placeholder="邮箱" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
        <input type="password" placeholder="密码" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} style={inputStyle} />
        <button type="submit" disabled={loading} style={{ width: '100%', padding: 12, borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.2)', marginTop: 4 }}>{loading ? '注册中...' : '免费注册 · 送 25 次搜索'}</button>
      </form>
      <p style={{ textAlign: 'center', fontSize: 14, color: '#94a3b8', marginTop: 16 }}>已有账号？<a href="/login" style={{ color: '#2563eb', fontWeight: 500 }}>登录</a></p>
    </div>
  );
}
