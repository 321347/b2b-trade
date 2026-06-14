'use client';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const u = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!u || !token) { window.location.href = '/login'; return; }
    setUser(JSON.parse(u));
    fetch('/api/dashboard', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json())
      .then(d => { if (!d.error) setData(d); else { localStorage.removeItem('user'); localStorage.removeItem('token'); window.location.href = '/login'; } })
      .catch(() => { window.location.href = '/login'; });
  }, []);

  const [smtp, setSmtp] = useState(null);
  const [tracks, setTracks] = useState(null);

  const recentSearches = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('searchHistory') || '[]')
    : [];

  useEffect(() => {
    if (user) {
      fetch('/api/smtp-config', { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } })
        .then(r => r.json()).then(d => setSmtp(d.config)).catch(() => {});
      fetch('/api/track/stats', { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } })
        .then(r => r.json()).then(d => setTracks(d)).catch(() => {});
    }
  }, [user]);

  if (!user || !data) return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>加载中...</div>;

  const { quota } = data;
  const pct = quota.total > 0 ? Math.round((quota.remaining / quota.total) * 100) : 0;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', margin: 0 }}>Hi, {user.name}</h1>
          <p style={{ color: '#94a3b8', margin: '4px 0 0', fontSize: 14 }}>{user.email || data.user?.email}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/" style={{ background: '#2563eb', color: '#fff', padding: '8px 18px', borderRadius: 6, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>去搜索</a>
          <button onClick={() => { localStorage.removeItem('user'); localStorage.removeItem('token'); window.location.href = '/'; }} style={{ background: '#f1f5f9', border: 'none', color: '#64748b', padding: '8px 18px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>退出</button>
        </div>
      </div>

      {/* 配额卡片 */}
      <div style={{ background: '#fff', borderRadius: 10, padding: 24, border: '1px solid #e5e7eb', marginBottom: 20 }}>
        <div style={{ fontSize: 14, color: '#64748b', marginBottom: 12 }}>搜索配额</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 36, fontWeight: 700, color: pct > 20 ? '#2563eb' : '#dc2626' }}>{quota.remaining}</span>
          <span style={{ fontSize: 14, color: '#94a3b8' }}>/ {quota.total} 次</span>
          {quota.used > 0 && <span style={{ fontSize: 13, color: '#94a3b8' }}>（已用 {quota.used} 次）</span>}
        </div>
        <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4 }}>
          <div style={{ height: '100%', borderRadius: 4, background: pct > 20 ? '#2563eb' : '#dc2626', width: pct + '%', transition: 'width .4s' }} />
        </div>
        {quota.remaining === 0 && (
          <p style={{ marginTop: 12, fontSize: 13, color: '#dc2626' }}>
            免费配额已用完，<a href="/pricing" style={{ color: '#2563eb', fontWeight: 500 }}>升级套餐</a>获取更多搜索次数
          </p>
        )}
      </div>

      {/* 邮件追踪 */}
      {tracks && (
        <div style={{ background: '#fff', borderRadius: 10, padding: 24, border: '1px solid #e5e7eb', marginBottom: 20 }}>
          <div style={{ fontSize: 14, color: '#64748b', marginBottom: 12 }}>邮件追踪</div>
          <div style={{ display: 'flex', gap: 24, marginBottom: tracks.tracks?.length > 0 ? 16 : 0 }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#2563eb' }}>{tracks.sent}</div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>已发送</div>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#16a34a' }}>{tracks.opened}</div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>已打开</div>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#f59e0b' }}>{tracks.sent > 0 ? Math.round((tracks.opened / tracks.sent) * 100) : 0}%</div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>打开率</div>
            </div>
          </div>
          {tracks.tracks?.length > 0 && (
            <div style={{ maxHeight: 180, overflowY: 'auto' }}>
              {tracks.tracks.slice(0, 15).map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f5f5f5', fontSize: 13 }}>
                  <div>
                    <span style={{ color: '#334155' }}>{t.recipient}</span>
                    {t.domain ? <span style={{ color: '#94a3b8', marginLeft: 8 }}>{t.domain}</span> : null}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#94a3b8' }}>
                    <span>{new Date(t.sent_at).toLocaleDateString('zh-CN')}</span>
                    {t.opened ? (
                      <span style={{ color: '#16a34a', fontWeight: 500 }}>已打开 {new Date(t.opened_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                    ) : (
                      <span style={{ color: '#d1d5db' }}>未打开</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {tracks.sent === 0 && <div style={{ fontSize: 13, color: '#94a3b8' }}>暂无邮件发送记录</div>}
        </div>
      )}

      {/* 邮箱配置状态 */}
      <div style={{ background: '#fff', borderRadius: 10, padding: 24, border: '1px solid #e5e7eb', marginBottom: 20 }}>
        <div style={{ fontSize: 14, color: '#64748b', marginBottom: 12 }}>发信邮箱</div>
        {smtp ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
              <span style={{ fontWeight: 500, color: '#0f172a' }}>已配置</span>
            </div>
            <div style={{ fontSize: 13, color: '#64748b' }}>{smtp.user} · {smtp.host}:{smtp.port}</div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#fbbf24', display: 'inline-block' }} />
              <span style={{ fontWeight: 500, color: '#0f172a' }}>未配置</span>
            </div>
            <a href="/email-settings" style={{ fontSize: 13, color: '#2563eb', fontWeight: 500 }}>去配置 →</a>
          </div>
        )}
      </div>

      {/* 最近搜索 */}
      <div style={{ background: '#fff', borderRadius: 10, padding: 24, border: '1px solid #e5e7eb', marginBottom: 20 }}>
        <div style={{ fontSize: 14, color: '#64748b', marginBottom: 12 }}>最近搜索</div>
        {recentSearches.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {recentSearches.slice(0, 10).map((s, i) => (
              <a key={i} href={`/search?q=${encodeURIComponent(s)}`}
                style={{ padding: '6px 14px', background: '#f1f5f9', borderRadius: 20, fontSize: 13, color: '#334155', textDecoration: 'none' }}>
                {s}
              </a>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: '#94a3b8' }}>暂无搜索记录，<a href="/" style={{ color: '#2563eb' }}>去搜索</a></div>
        )}
      </div>

      {/* 快捷入口 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <a href="/" style={{ background: '#fff', borderRadius: 10, padding: 20, border: '1px solid #e5e7eb', textDecoration: 'none', color: '#0f172a' }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>搜索客户</div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>输入产品找海外采购商</div>
        </a>
        <a href="/send" style={{ background: '#fff', borderRadius: 10, padding: 20, border: '1px solid #e5e7eb', textDecoration: 'none', color: '#0f172a' }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>手动发信</div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>单封或批量发送邮件</div>
        </a>
        <a href="/email-settings" style={{ background: '#fff', borderRadius: 10, padding: 20, border: '1px solid #e5e7eb', textDecoration: 'none', color: '#0f172a' }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>邮箱设置</div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>配置 SMTP 发信邮箱</div>
        </a>
        <a href="/industries" style={{ background: '#fff', borderRadius: 10, padding: 20, border: '1px solid #e5e7eb', textDecoration: 'none', color: '#0f172a' }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>行业品类</div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>按行业浏览采购商</div>
        </a>
        <a href="/pricing" style={{ background: '#fff', borderRadius: 10, padding: 20, border: '1px solid #e5e7eb', textDecoration: 'none', color: '#0f172a' }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>升级套餐</div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>获取更多搜索次数</div>
        </a>
      </div>
    </div>
  );
}
