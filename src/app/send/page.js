'use client';
import { useState, useEffect } from 'react';
import { XCircle, CheckCircle } from 'lucide-react';
import { authHeaders } from '@/lib/utils';

export default function Send() {
  const [auth, setAuth] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', company: '', subject: '', body: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkProgress, setBulkProgress] = useState(null);
  const [sendLimit, setSendLimit] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem('user')) { window.location.href = '/login'; return; }
    setAuth(true);
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('to')) setForm(prev => ({ ...prev, email: sp.get('to') || '', company: sp.get('domain') || '' }));
  }, []);
  if (!auth) return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>请先登录...</div>;

  useEffect(() => {
    fetch('/api/dashboard', { headers: authHeaders() }).then(r => r.json()).then(d => {
      if (d.sendLimit) setSendLimit(d.sendLimit);
    }).catch(() => {});
  }, []);

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const inp = (k, ph, type) => <input type={type || 'text'} placeholder={ph} value={form[k]} onChange={e => update(k, e.target.value)} style={{ width:'100%', padding:10, borderRadius:8, border:'1px solid #d1d5db', background:'#fff', fontSize:14, marginBottom:10, outline:'none' }} />;

  async function sendSingle(e) {
    e.preventDefault();
    if (!form.email || !form.email.includes('@')) { setResult({ error: '请输入有效邮箱' }); return; }
    setLoading(true); setResult(null);
    try {
      const r = await fetch('/api/send', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ to: form.email, name: form.name, company: form.company, subject: form.subject || 'Business Inquiry', body: form.body }) });
      setResult(await r.json());
    } catch { setResult({ error: '发送失败' }); }
    setLoading(false);
  }

  async function sendBulk() {
    const lines = bulkText.trim().split('\n').filter(l => l.trim());
    const targets = lines.map(line => {
      const p = line.split(',').map(s => s.trim());
      return { email: p[0] || '', name: p[1] || '', company: p[2] || '', subject: p[3] || 'Business Inquiry', body: p[4] || '' };
    });
    if (!targets.length || !targets[0].email.includes('@')) { setResult({ error: '格式错误' }); return; }
    setLoading(true); setResult(null); setBulkProgress({ sent: 0, total: targets.length });
    const ok = []; const fail = [];
    for (const t of targets) {
      try {
        const r = await fetch('/api/send', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ to: t.email, name: t.name, company: t.company, subject: t.subject, body: t.body }) });
        const d = await r.json();
        if (d.ok) ok.push(t.email); else fail.push({ email: t.email, error: d.error });
      } catch { fail.push({ email: t.email, error: '网络错误' }); }
      setBulkProgress({ sent: ok.length + fail.length, total: targets.length });
      // 每封间隔 2-3 分钟
      await new Promise(r => setTimeout(r, 120000 + Math.random() * 60000));
    }
    setResult({ sent: ok.length, failed: fail.length, details: fail });
    setLoading(false); setBulkProgress(null);
  }

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: '0 20px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>发信</h1>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => { setBulkMode(false); setResult(null); }} style={{ background: bulkMode ? '#f1f5f9' : '#2563eb', color: bulkMode ? '#64748b' : '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>单封</button>
          <button onClick={() => { setBulkMode(true); setResult(null); }} style={{ background: bulkMode ? '#2563eb' : '#f1f5f9', color: bulkMode ? '#fff' : '#64748b', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>批量</button>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>每封间隔 2-3 分钟</span>
        </div>
        {sendLimit && (
          <span style={{ fontSize: 13, color: sendLimit.allowed ? '#64748b' : '#dc2626', fontWeight: 500 }}>
            今日：{sendLimit.sentToday}/{sendLimit.maxPerDay === Infinity ? '不限' : sendLimit.maxPerDay}
          </span>
        )}
      </div>

      {!bulkMode ? (
        <form onSubmit={sendSingle}>
          {inp('email', '收件人邮箱 *')}
          {inp('name', '收件人姓名')}
          {inp('company', '公司名称')}
          {inp('subject', '邮件主题')}
          <textarea value={form.body} onChange={e => update('body', e.target.value)} placeholder="邮件正文" rows={6} style={{ width:'100%', padding:10, borderRadius:8, border:'1px solid #d1d5db', background:'#fff', fontSize:14, marginBottom:10, outline:'none' }} />
          <button type="submit" disabled={loading} style={{ background:'#2563eb',color:'#fff',border:'none',padding:'12px 28px',borderRadius:8,cursor:'pointer',fontSize:15,fontWeight:600 }}>{loading ? '发送中...' : '发送'}</button>
        </form>
      ) : (
        <div>
          <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} placeholder={`每行一个客户，逗号分隔：\nbuyer@example.com, John, ABC Corp, 采购咨询, 正文内容`} rows={12} style={{ width:'100%', padding:10, borderRadius:8, border:'1px solid #d1d5db', background:'#fff', fontSize:13, fontFamily:'monospace', marginBottom:10, outline:'none' }} />
          {bulkProgress && (
            <div style={{ marginBottom: 10, fontSize: 13, color: '#64748b' }}>
              发送中：{bulkProgress.sent}/{bulkProgress.total}
              <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, marginTop: 4 }}>
                <div style={{ height: '100%', background: '#2563eb', borderRadius: 2, width: `${(bulkProgress.sent / bulkProgress.total) * 100}%`, transition: 'width .3s' }} />
              </div>
            </div>
          )}
          <button onClick={sendBulk} disabled={loading} style={{ background:'#2563eb',color:'#fff',border:'none',padding:'12px 28px',borderRadius:8,cursor:'pointer',fontSize:15,fontWeight:600 }}>{loading ? '发送中...' : '批量发送'}</button>
        </div>
      )}

      {result && (
        <div style={{ marginTop: 20, padding: 16, borderRadius: 8, background: result.error ? '#fef2f2' : '#f0fdf4', border: '1px solid ' + (result.error ? '#fecaca' : '#bbf7d0') }}>
          {result.error ? <div style={{ color: '#dc2626' }}><XCircle size={16} style={{ marginRight: 4 }} />{result.error}</div>
            : <div style={{ color: '#15803d' }}><CheckCircle size={16} style={{ marginRight: 4 }} />发送 {result.sent || result.results?.length} 封，失败 {result.failed || 0} 封
              {result.results && <ul style={{ marginTop: 8, fontSize: 13 }}>{result.results.map((r,i) => <li key={i}>{r.email}: {r.status === 'ok' ? '已发送' : r.error}</li>)}</ul>}
            </div>}
        </div>
      )}
    </div>
  );
}
