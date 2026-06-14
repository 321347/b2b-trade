'use client';
import { useState, useEffect } from 'react';

export default function Nav() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const u = localStorage.getItem('user');
    try { if (u) setUser(JSON.parse(u)); } catch { localStorage.removeItem('user'); }
  }, []);

  const links = [
    { href: '/', label: '首页' },
    { href: '/industries', label: '行业品类' },
    { href: '/email-settings', label: '邮箱设置', hideMobile: true },
    { href: '/dashboard', label: '数据看板', hideMobile: true },
    { href: '/pricing', label: '定价' },
  ];
  return (
    <nav style={{ borderBottom: '1px solid #e5e7eb', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, maxWidth: 1200, margin: '0 auto', background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        <a href="/" style={{ fontWeight: 800, fontSize: 18, color: '#1e3a5f', textDecoration: 'none', letterSpacing: '-0.5px' }}>🐟 鱼获科技</a>
        {links.map(l => (
          <a key={l.href} href={l.href} className={l.hideMobile ? 'hide-mobile' : ''} style={{ fontSize: 14, color: '#64748b', textDecoration: 'none', fontWeight: 500 }}>{l.label}</a>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {user ? (
          <>
            <a href="/dashboard" style={{ fontSize: 14, color: '#64748b', textDecoration: 'none' }}>{user.name || user.email}</a>
            <button onClick={() => { localStorage.removeItem('user'); localStorage.removeItem('token'); window.location.href = '/'; }} style={{ fontSize: 13, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>退出</button>
          </>
        ) : (
          <>
            <a href="/login" style={{ fontSize: 14, color: '#64748b', textDecoration: 'none' }}>登录</a>
            <a href="/register" style={{ fontSize: 14, color: '#fff', background: '#2563eb', padding: '8px 20px', borderRadius: 6, textDecoration: 'none', fontWeight: 600 }}>免费注册</a>
          </>
        )}
      </div>
    </nav>
  );
}
