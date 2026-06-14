'use client';
import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setHasSession(true);
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 6) { setError('密码至少 6 位'); return; }
    setError(''); setLoading(true);
    const supabase = getSupabase();
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) setError(err.message);
    else setDone(true);
    setLoading(false);
  }

  if (!hasSession) {
    return (
      <div style={{ maxWidth: 400, margin: '80px auto', padding: 20, textAlign: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>链接已过期</h1>
        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>
          密码重置链接已过期或无效。请重新发起找回密码。
        </p>
        <a href="/forgot-password" style={{ color: '#2563eb', fontWeight: 500, fontSize: 14 }}>重新找回密码</a>
      </div>
    );
  }

  if (done) {
    return (
      <div style={{ maxWidth: 400, margin: '80px auto', padding: 20, textAlign: 'center' }}>
        <div style={{ padding: 24, background: '#f0fdf4', borderRadius: 8, color: '#16a34a', fontSize: 14, marginBottom: 16 }}>
          密码已重置成功
        </div>
        <a href="/login" style={{ color: '#2563eb', fontWeight: 500, fontSize: 14 }}>去登录</a>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 20 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 24, color: '#0f172a' }}>设置新密码</h1>
      {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: 10, borderRadius: 6, marginBottom: 16, fontSize: 14 }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <input type="password" placeholder="新密码（至少 6 位）" value={password} onChange={e => setPassword(e.target.value)} required
          style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', fontSize: 14, marginBottom: 16, outline: 'none' }} />
        <button type="submit" disabled={loading}
          style={{ width: '100%', padding: 12, borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
          {loading ? '设置中...' : '设置新密码'}
        </button>
      </form>
    </div>
  );
}
