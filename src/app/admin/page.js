'use client';
import { useState, useEffect, useMemo } from 'react';

const PLAN_KEYS = ['free', 'starter', 'basic', 'pro', 'enterprise'];
const PLAN_NAMES = { free: '免费版', starter: '入门版', basic: '基础版', pro: '专业版', enterprise: '企业版' };
const PAGE_SIZES = [10, 20, 50, 100];

export default function Admin() {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_token');
    if (saved) { setToken(saved); fetchUsers(saved); }
  }, []);

  async function fetchUsers(t) {
    setLoading(true);
    const res = await fetch('/api/admin/users', { headers: { authorization: `Bearer ${t}` } });
    const data = await res.json();
    if (data.users) setUsers(data.users);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(u =>
      (u.email || '').toLowerCase().includes(q) ||
      (u.name || '').toLowerCase().includes(q) ||
      (PLAN_NAMES[u.plan] || '').includes(q)
    );
  }, [users, search]);

  const stats = useMemo(() => {
    const paying = users.filter(u => u.plan !== 'free').length;
    return { total: users.length, paying, free: users.length - paying };
  }, [users]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

  // 搜索变化时回到第一页
  function handleSearch(v) {
    setSearch(v);
    setPage(0);
  }

  function exportCSV() {
    const BOM = '﻿';
    const header = '姓名,邮箱,套餐,剩余搜索,注册时间,最后登录\n';
    const rows = filtered.map(u => [
      u.name || '',
      u.email || '',
      PLAN_NAMES[u.plan] || u.plan,
      u.searchesLeft,
      u.created ? new Date(u.created).toLocaleDateString('zh-CN') : '',
      u.lastSignIn ? new Date(u.lastSignIn).toLocaleDateString('zh-CN') : '',
    ].map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([BOM + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `users_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  async function handleLogin(e) {
    e.preventDefault();
    const res = await fetch('/api/admin/login', { method: 'POST', body: JSON.stringify({ password }), headers: { 'Content-Type': 'application/json' } });
    const data = await res.json();
    if (data.ok) {
      sessionStorage.setItem('admin_token', data.token);
      setToken(data.token);
      fetchUsers(data.token);
    } else {
      setMsg(data.error);
    }
  }

  async function changePlan(userId, plan) {
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({ userId, plan }),
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setMsg(data.ok ? `已更新套餐为 ${PLAN_NAMES[plan]}` : data.error);
    if (data.ok) fetchUsers(token);
  }

  function logout() {
    sessionStorage.removeItem('admin_token');
    setToken('');
    setUsers([]);
  }

  if (!token) {
    return (
      <div style={{ maxWidth: 400, margin: '100px auto', padding: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, textAlign: 'center', marginBottom: 24 }}>管理员登录</h1>
        <form onSubmit={handleLogin}>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="输入管理密码" style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }} />
          <button type="submit" style={{ width: '100%', padding: 12, borderRadius: 8, background: '#0f172a', color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}>登录</button>
        </form>
        {msg && <p style={{ color: '#ef4444', textAlign: 'center', marginTop: 12, fontSize: 14 }}>{msg}</p>}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: '40px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>用户管理</h1>
        <button onClick={logout} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 13 }}>退出登录</button>
      </div>

      {msg && <div style={{ padding: '8px 16px', borderRadius: 8, background: '#f0fdf4', color: '#16a34a', marginBottom: 12, fontSize: 14 }}>{msg}</div>}

      {/* 工具栏：搜索 + 导出 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="text" placeholder="搜索姓名/邮箱/套餐..."
            value={search} onChange={e => handleSearch(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, width: 240 }}
          />
          <span style={{ fontSize: 13, color: '#94a3b8' }}>
            共 {filtered.length} 人{search && `（共 ${users.length} 人）`}
          </span>
        </div>
        <button onClick={exportCSV} disabled={filtered.length === 0}
          style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: filtered.length ? 'pointer' : 'default', fontSize: 13, opacity: filtered.length ? 1 : 0.5 }}>
          📥 导出 CSV
        </button>
      </div>

      {loading ? <p>加载中...</p> : (
        <>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <div style={{ flex: 1, background: '#fff', borderRadius: 10, padding: 16, border: '1px solid #e5e7eb', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a' }}>{stats.total}</div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>总用户</div>
            </div>
            <div style={{ flex: 1, background: '#fff', borderRadius: 10, padding: 16, border: '1px solid #e5e7eb', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#2563eb' }}>{stats.paying}</div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>付费用户</div>
            </div>
            <div style={{ flex: 1, background: '#fff', borderRadius: 10, padding: 16, border: '1px solid #e5e7eb', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#f59e0b' }}>{stats.free}</div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>免费用户</div>
            </div>
            <div style={{ flex: 1, background: '#fff', borderRadius: 10, padding: 16, border: '1px solid #e5e7eb', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#16a34a' }}>{stats.total > 0 ? Math.round((stats.paying / stats.total) * 100) : 0}%</div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>付费率</div>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: 12, textAlign: 'left' }}>用户</th>
                <th style={{ padding: 12, textAlign: 'left' }}>邮箱</th>
                <th style={{ padding: 12, textAlign: 'center' }}>当前套餐</th>
                <th style={{ padding: 12, textAlign: 'center' }}>剩余搜索</th>
                <th style={{ padding: 12, textAlign: 'center' }}>API密钥</th>
                <th style={{ padding: 12, textAlign: 'center' }}>注册时间</th>
                <th style={{ padding: 12, textAlign: 'center' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>无匹配用户</td></tr>
              ) : (
                paged.map((u, i) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: 10 }}>{u.name || '-'}</td>
                    <td style={{ padding: 10, color: '#64748b' }}>{u.email}</td>
                    <td style={{ padding: 10, textAlign: 'center' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: u.plan === 'enterprise' ? '#0f172a' : u.plan === 'pro' ? '#2563eb' : '#f1f5f9', color: u.plan === 'enterprise' || u.plan === 'pro' ? '#fff' : '#334155' }}>{PLAN_NAMES[u.plan] || u.plan}</span>
                    </td>
                    <td style={{ padding: 10, textAlign: 'center' }}>{u.searchesLeft}</td>
                    <td style={{ padding: 10, textAlign: 'center' }}>
                      {u.apiKey ? (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <code style={{ fontSize: 11, background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={u.apiKey}>{u.apiKey.slice(0, 12)}...</code>
                          <button onClick={() => { navigator.clipboard.writeText(u.apiKey); setMsg('已复制 API Key'); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#2563eb' }}>复制</button>
                          <button onClick={async () => {
                            await fetch('/api/admin/api-key', { method: 'POST', body: JSON.stringify({ userId: u.id, action: 'revoke' }), headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` } });
                            setMsg('已撤销 API Key'); fetchUsers(token);
                          }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#dc2626' }}>撤销</button>
                        </span>
                      ) : (
                        <button onClick={async () => {
                          const res = await fetch('/api/admin/api-key', { method: 'POST', body: JSON.stringify({ userId: u.id, action: 'generate' }), headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` } });
                          const d = await res.json();
                          if (d.ok) { setMsg('已生成 API Key: ' + d.api_key); fetchUsers(token); }
                          else setMsg(d.error);
                        }} style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 12 }}>生成</button>
                      )}
                    </td>
                    <td style={{ padding: 10, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>{u.created ? new Date(u.created).toLocaleDateString('zh-CN') : '-'}</td>
                    <td style={{ padding: 10, textAlign: 'center' }}>
                      <select value={u.plan} onChange={e => changePlan(u.id, e.target.value)} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13 }}>
                        {PLAN_KEYS.map(k => <option key={k} value={k}>{PLAN_NAMES[k]}</option>)}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* 分页 */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 20 }}>
              <button disabled={page === 0} onClick={() => setPage(page - 1)}
                style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: page > 0 ? 'pointer' : 'default', fontSize: 13, opacity: page > 0 ? 1 : 0.4 }}>
                上一页
              </button>
              <span style={{ fontSize: 13, color: '#64748b' }}>
                第 {page + 1} / {totalPages} 页
              </span>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}
                style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: page < totalPages - 1 ? 'pointer' : 'default', fontSize: 13, opacity: page < totalPages - 1 ? 1 : 0.4 }}>
                下一页
              </button>
              <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(0); }}
                style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13 }}>
                {PAGE_SIZES.map(n => <option key={n} value={n}>每页 {n} 条</option>)}
              </select>
            </div>
          )}
        </>
      )}
    </div>
  );
}
