'use client';
import { useState, useEffect } from 'react';
import { Search, Mail, Building2, Trash2, Star, StarOff, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { authHeaders } from '@/lib/utils';

const STATUS_MAP = {
  contacted: { label: '已联系', color: '#64748b', bg: '#f1f5f9' },
  interested: { label: '有意向', color: '#f59e0b', bg: '#fef3c7' },
  not_interested: { label: '无兴趣', color: '#94a3b8', bg: '#f8fafc' },
  customer: { label: '已成交', color: '#10b981', bg: '#d1fae5' },
};

export default function CrmPage() {
  const [auth, setAuth] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [editing, setEditing] = useState(null);
  const limit = 30;

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) { window.location.href = '/login'; return; }
    setAuth(true);
  }, []);

  useEffect(() => {
    if (!auth) return;
    loadContacts();
  }, [auth, filter, page]);

  async function loadContacts() {
    setLoading(true);
    const params = new URLSearchParams({ page, limit, ...(filter && { status: filter }) });
    const r = await fetch(`/api/crm?${params}`, { headers: authHeaders() });
    const d = await r.json();
    if (d.contacts) { setContacts(d.contacts); setTotal(d.total); }
    setLoading(false);
  }

  async function updateStatus(id, status) {
    await fetch('/api/crm', { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ id, status }) });
    setContacts(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  }

  async function deleteContact(id) {
    await fetch(`/api/crm?id=${id}`, { method: 'DELETE', headers: authHeaders() });
    setContacts(prev => prev.filter(c => c.id !== id));
    setTotal(prev => prev - 1);
  }

  async function saveNotes(id, notes) {
    await fetch('/api/crm', { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ id, notes }) });
    setEditing(null);
    setContacts(prev => prev.map(c => c.id === id ? { ...c, notes } : c));
  }

  const filtered = search
    ? contacts.filter(c => c.email.includes(search) || c.company.includes(search) || c.name.includes(search))
    : contacts;

  if (!auth) return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>请先登录...</div>;

  return (
    <div style={{ maxWidth: 960, margin: '40px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', margin: 0 }}>客户 CRM</h1>
        <a href="/search" style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none' }}>去搜索新客户 →</a>
      </div>

      {/* 搜索 + 筛选 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="搜索姓名、公司、邮箱..."
            style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, outline: 'none' }} />
        </div>
        <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}
          style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#334155' }}>
          <option value="">全部状态</option>
          {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* 统计 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {Object.entries(STATUS_MAP).map(([k, v]) => (
          <button key={k} onClick={() => { setFilter(filter === k ? '' : k); setPage(1); }}
            style={{
              padding: '6px 14px', borderRadius: 20, border: filter === k ? `2px solid ${v.color}` : '1px solid #e5e5e5',
              background: filter === k ? v.bg : '#fff', cursor: 'pointer', fontSize: 12, color: filter === k ? v.color : '#64748b',
              fontWeight: filter === k ? 600 : 400,
            }}>
            {v.label}
          </button>
        ))}
      </div>

      {/* 表格 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>加载中...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#fafafa', borderRadius: 8 }}>
          <p style={{ fontSize: 15, color: '#64748b', marginBottom: 12 }}>还没有联系人，去搜索页找海外客户吧</p>
          <a href="/search" style={{ color: '#2563eb', textDecoration: 'none', fontSize: 14 }}>搜索客户 →</a>
        </div>
      ) : (
        <div style={{ border: '1px solid #e5e5e5', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 100px 40px', gap: 10, padding: '10px 16px', background: '#fafafa', borderBottom: '1px solid #e5e5e5', fontSize: 12, fontWeight: 600, color: '#64748b' }}>
            <span>联系人</span>
            <span>公司</span>
            <span>备注</span>
            <span>状态</span>
            <span></span>
          </div>
          {filtered.map(c => (
            <div key={c.id}
              style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 100px 40px', gap: 10, padding: '12px 16px', alignItems: 'start', borderBottom: '1px solid #f3f3f3', background: c.status === 'interested' ? '#fffdf5' : '#fff' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>
                  {c.name || '未知名'} {c.status === 'interested' && <Star size={14} style={{ color: '#f59e0b', verticalAlign: 'middle', marginLeft: 4 }} />}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Mail size={11} /> {c.email}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#334155', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Building2 size={11} /> {c.company || '-'}
                </div>
                {c.market && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{c.market}</div>}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>
                {editing === c.id ? (
                  <textarea autoFocus defaultValue={c.notes || ''}
                    onBlur={e => saveNotes(c.id, e.target.value)}
                    onKeyDown={e => { if (e.key === 'Escape') setEditing(null); }}
                    style={{ width: '100%', padding: 4, fontSize: 12, borderRadius: 4, border: '1px solid #d1d5db', outline: 'none', resize: 'vertical' }}
                    rows={2} />
                ) : (
                  <div onClick={() => setEditing(c.id)} style={{ cursor: 'pointer', minHeight: 20 }}>
                    {c.notes || <span style={{ color: '#d1d5db' }}>点击添加备注</span>}
                  </div>
                )}
              </div>
              <div>
                <select value={c.status} onChange={e => updateStatus(c.id, e.target.value)}
                  style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e5e5e5', fontSize: 11, cursor: 'pointer', background: (STATUS_MAP[c.status] || STATUS_MAP.contacted).bg, color: (STATUS_MAP[c.status] || STATUS_MAP.contacted).color, fontWeight: 600 }}>
                  {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{c.contacted_at?.slice(0, 10)}</div>
              </div>
              <div>
                <button onClick={() => deleteContact(c.id)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 分页 */}
      {total > limit && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 20 }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #e5e5e5', background: '#fff', cursor: page > 1 ? 'pointer' : 'default', opacity: page > 1 ? 1 : 0.4 }}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: 13, color: '#64748b' }}>{page} / {Math.ceil(total / limit)}</span>
          <button disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(p => p + 1)}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #e5e5e5', background: '#fff', cursor: page < Math.ceil(total / limit) ? 'pointer' : 'default', opacity: page < Math.ceil(total / limit) ? 1 : 0.4 }}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
