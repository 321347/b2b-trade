'use client';
import { useState } from 'react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const r = await fetch('/api/auth/reset-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const d = await r.json();
      if (d.ok) setSent(true);
      else setError(d.error || '发送失败');
    } catch { setError('网络错误，请重试'); }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 20 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 24, color: '#0f172a' }}>找回密码</h1>
      {sent ? (
        <div style={{ textAlign: 'center', padding: 24, background: '#f0fdf4', borderRadius: 8, color: '#16a34a', fontSize: 14 }}>
          重置密码链接已发送到 {email}，请检查邮箱（可能在垃圾邮件中）。
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: 10, borderRadius: 6, marginBottom: 16, fontSize: 14 }}>{error}</div>}
          <input type="email" placeholder="注册邮箱" value={email} onChange={e => setEmail(e.target.value)} required
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', fontSize: 14, marginBottom: 16, outline: 'none' }} />
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: 12, borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            {loading ? '发送中...' : '发送重置链接'}
          </button>
        </form>
      )}
      <p style={{ textAlign: 'center', fontSize: 14, color: '#94a3b8', marginTop: 16 }}>
        <a href="/login" style={{ color: '#2563eb', fontWeight: 500 }}>返回登录</a>
      </p>
    </div>
  );
}
