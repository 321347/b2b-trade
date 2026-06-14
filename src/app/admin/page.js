'use client';
import { useState, useEffect } from 'react';

const PLAN_KEYS = ['free', 'starter', 'basic', 'pro', 'enterprise'];
const PLAN_NAMES = { free: '免费版', starter: '入门版', basic: '基础版', pro: '专业版', enterprise: '企业版' };

export default function Admin() {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>用户管理</h1>
        <button onClick={logout} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 13 }}>退出登录</button>
      </div>
      {msg && <div style={{ padding: '8px 16px', borderRadius: 8, background: '#f0fdf4', color: '#16a34a', marginBottom: 16, fontSize: 14 }}>{msg}</div>}
      {loading ? <p>加载中...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ padding: 12, textAlign: 'left' }}>用户</th>
              <th style={{ padding: 12, textAlign: 'left' }}>邮箱</th>
              <th style={{ padding: 12, textAlign: 'center' }}>当前套餐</th>
              <th style={{ padding: 12, textAlign: 'center' }}>剩余搜索</th>
              <th style={{ padding: 12, textAlign: 'center' }}>注册时间</th>
              <th style={{ padding: 12, textAlign: 'center' }}>切换套餐</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: 10 }}>{u.name || '-'}</td>
                <td style={{ padding: 10, color: '#64748b' }}>{u.email}</td>
                <td style={{ padding: 10, textAlign: 'center' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: u.plan === 'enterprise' ? '#0f172a' : u.plan === 'pro' ? '#2563eb' : '#f1f5f9', color: u.plan === 'enterprise' || u.plan === 'pro' ? '#fff' : '#334155' }}>{PLAN_NAMES[u.plan] || u.plan}</span>
                </td>
                <td style={{ padding: 10, textAlign: 'center' }}>{u.searchesLeft}</td>
                <td style={{ padding: 10, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>{u.created ? new Date(u.created).toLocaleDateString('zh-CN') : '-'}</td>
                <td style={{ padding: 10, textAlign: 'center' }}>
                  <select value={u.plan} onChange={e => changePlan(u.id, e.target.value)} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13 }}>
                    {PLAN_KEYS.map(k => <option key={k} value={k}>{PLAN_NAMES[k]}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
