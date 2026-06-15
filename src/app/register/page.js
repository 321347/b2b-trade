'use client';
import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const turnstileRef = useRef(null);
  const widgetIdRef = useRef(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  function resetTurnstile() {
    if (widgetIdRef.current != null && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }

  function renderTurnstile() {
    if (!siteKey || !window.turnstile || !turnstileRef.current) return;
    if (widgetIdRef.current != null) {
      window.turnstile.reset(widgetIdRef.current);
      return;
    }
    widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
      sitekey: siteKey,
      theme: 'light',
      size: 'normal',
    });
  }

  function getTurnstileToken() {
    if (!siteKey) return null;
    if (widgetIdRef.current != null && window.turnstile) {
      return window.turnstile.getResponse(widgetIdRef.current);
    }
    return null;
  }

  async function handleSendCode(e) {
    e.preventDefault();
    setError('');
    if (!email) { setError('请输入邮箱'); return; }
    if (password.length < 6) { setError('密码至少 6 位'); return; }

    const token = getTurnstileToken();
    if (siteKey && !token) { setError('请完成安全验证'); return; }

    setLoading(true);
    try {
      const r = await fetch('/api/auth/send-code', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token }),
      });
      const d = await r.json();
      if (d.ok) {
        setCodeSent(true);
        setCountdown(60);
        resetTurnstile();
      } else {
        setError(d.error || '发送失败');
        resetTurnstile();
      }
    } catch {
      setError('网络错误，请重试');
      resetTurnstile();
    }
    setLoading(false);
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    if (!code || code.length !== 6) { setError('请输入 6 位验证码'); return; }
    setLoading(true);
    try {
      const r = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, code }),
      });
      const d = await r.json();
      if (d.ok) {
        if (d.session) {
          localStorage.setItem('user', JSON.stringify(d.user));
          localStorage.setItem('token', d.session.access_token);
          window.location.href = '/dashboard?new=1';
        } else {
          window.location.href = '/login?registered=1';
        }
      } else {
        setError(d.error || '注册失败');
      }
    } catch {
      setError('网络错误，请重试');
    }
    setLoading(false);
  }

  const inputStyle = { width: '100%', padding: 12, borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', fontSize: 14, marginBottom: 12, outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 20 }}>
      {siteKey && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" onLoad={() => renderTurnstile()} strategy="lazyOnload" />}

      <h1 style={{ fontSize: 28, fontWeight: 700, textAlign: 'center', marginBottom: 24, color: '#0f172a' }}>注册</h1>
      {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: 10, borderRadius: 6, marginBottom: 16, fontSize: 14 }}>{error}</div>}

      {!codeSent ? (
        <form onSubmit={handleSendCode}>
          <input type="text" placeholder="姓名（选填）" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
          <input type="email" placeholder="邮箱" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
          <input type="password" placeholder="密码（至少 6 位）" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} style={inputStyle} />

          {siteKey && (
            <div style={{ marginBottom: 12 }}>
              <div ref={turnstileRef} />
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: 12, borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.2)' }}>
            {loading ? '发送中...' : '发送验证码'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister}>
          <div style={{ marginBottom: 12, fontSize: 14, color: '#64748b' }}>
            验证码已发送至 <strong>{email}</strong>
          </div>
          <input type="text" placeholder="请输入 6 位验证码" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} required
            style={{ ...inputStyle, fontSize: 20, letterSpacing: 6, textAlign: 'center', fontWeight: 700 }} />

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: 12, borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.2)', marginTop: 4 }}>
            {loading ? '注册中...' : '免费注册 · 送 10 次搜索'}
          </button>

          <button type="button" onClick={() => { setCodeSent(false); setError(''); }}
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#64748b', fontSize: 14, cursor: 'pointer', marginTop: 8 }}>
            {countdown > 0 ? `${countdown} 秒后可重新发送` : '重新发送验证码'}
          </button>
        </form>
      )}

      <p style={{ textAlign: 'center', fontSize: 14, color: '#94a3b8', marginTop: 16 }}>已有账号？<a href="/login" style={{ color: '#2563eb', fontWeight: 500 }}>登录</a></p>
    </div>
  );
}
