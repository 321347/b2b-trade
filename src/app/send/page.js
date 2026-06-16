'use client';
import { useState, useEffect } from 'react';
import { XCircle, CheckCircle, Wand2 } from 'lucide-react';
import { authHeaders } from '@/lib/utils';

export default function Send() {
  const [auth, setAuth] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', company: '', product: '', subject: '', body: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkProgress, setBulkProgress] = useState(null);
  const [sendLimit, setSendLimit] = useState(null);
  // AI 生成选项
  const [aiOptions, setAiOptions] = useState({ tone: 'formal', length: 'medium', catalog: true, sample: false, companyIntro: true });
  const [aiLoading, setAiLoading] = useState(false);
  // 签名
  const [signature, setSignature] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  const S = typeof window !== 'undefined' ? window.localStorage : null;

  useEffect(() => {
    if (S) {
      const sig = S.getItem('emailSignature');
      if (sig) setSignature(sig);
    }
  }, []);

  useEffect(() => {
    if (!S || !S.getItem('user')) { window.location.href = '/login'; return; }
    setAuth(true);
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('to')) setForm(prev => ({ ...prev, email: sp.get('to') || '', company: sp.get('domain') || '' }));
  }, []);

  useEffect(() => {
    fetch('/api/dashboard', { headers: authHeaders() }).then(r => r.json()).then(d => {
      if (d.sendLimit) setSendLimit(d.sendLimit);
    }).catch(() => {});
  }, []);

  if (!auth) return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>请先登录...</div>;

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const inp = (k, ph, type) => <input type={type || 'text'} placeholder={ph} value={form[k]} onChange={e => update(k, e.target.value)} style={{ width:'100%', padding:10, borderRadius:8, border:'1px solid #d1d5db', background:'#fff', fontSize:14, marginBottom:10, outline:'none' }} />;

  // 变量替换
  function applyTemplate(body) {
    return body
      .replace(/\{客户姓名\}/g, form.name || 'Sir/Madam')
      .replace(/\{公司名\}/g, form.company || 'your company')
      .replace(/\{产品\}/g, form.product || 'our products')
      .replace(/\{邮箱\}/g, form.email || '')
      .replace(/\{签名\}/g, signature || '');
  }

  async function handleAiGenerate() {
    if (!form.company && !form.product) { setResult({ error: '请先填写公司名或产品' }); return; }
    setAiLoading(true); setResult(null);
    try {
      const r = await fetch('/api/generate-email', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({
          company: form.company,
          product: form.product,
          contactName: form.name,
          tone: aiOptions.tone,
          length: aiOptions.length,
          extras: { catalog: aiOptions.catalog, sample: aiOptions.sample, companyIntro: aiOptions.companyIntro },
        }),
      });
      const d = await r.json();
      if (d.subject) update('subject', d.subject);
      if (d.body) {
        const bodyWithSig = signature ? d.body.replace(/Best regards,\n跨境蜂/, `Best regards,\n${signature}`) : d.body;
        update('body', bodyWithSig);
      }
      if (d.error) setResult({ error: d.error });
    } catch { setResult({ error: '生成失败' }); }
    setAiLoading(false);
  }

  async function sendSingle(e) {
    e.preventDefault();
    if (!form.email || !form.email.includes('@')) { setResult({ error: '请输入有效邮箱' }); return; }
    setLoading(true); setResult(null);
    const body = applyTemplate(form.body);
    try {
      const r = await fetch('/api/send', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ to: form.email, name: form.name, company: form.company, subject: form.subject || 'Business Inquiry', body }) });
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
        const body = applyTemplate(t.body || form.body);
        const r = await fetch('/api/send', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ to: t.email, name: t.name || form.name, company: t.company || form.company, subject: t.subject || form.subject, body }) });
        const d = await r.json();
        if (d.ok) ok.push(t.email); else fail.push({ email: t.email, error: d.error });
      } catch { fail.push({ email: t.email, error: '网络错误' }); }
      setBulkProgress({ sent: ok.length + fail.length, total: targets.length });
      await new Promise(r => setTimeout(r, 120000 + Math.random() * 60000));
    }
    setResult({ sent: ok.length, failed: fail.length, details: fail });
    setLoading(false); setBulkProgress(null);
  }

  function saveSignature() {
    if (S) S.setItem('emailSignature', signature);
    setResult({ sent: 1, failed: 0 });
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

      {/* 签名设置 */}
      <details style={{ marginBottom: 16, fontSize: 13, color: '#64748b', cursor: 'pointer' }}>
        <summary style={{ marginBottom: 8 }}>邮件签名设置</summary>
        <textarea
          value={signature}
          onChange={e => setSignature(e.target.value)}
          placeholder={`张三\nSales Manager\nABC Trading Co., Ltd.\nWhatsApp: +86 138xxxx`}
          rows={4}
          style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, marginBottom: 8, outline: 'none', fontFamily: 'monospace' }}
        />
        <button onClick={saveSignature} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, cursor: 'pointer' }}>保存签名</button>
      </details>

      {!bulkMode ? (
        <form onSubmit={sendSingle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            {inp('email', '收件人邮箱 *')}
            {inp('name', '收件人姓名')}
            {inp('company', '公司名称')}
            {inp('product', '产品名（AI 生成用）')}
          </div>
          {inp('subject', '邮件主题')}
          <textarea value={form.body} onChange={e => update('body', e.target.value)}
            placeholder={`邮件正文 · 可用变量：{客户姓名} {公司名} {产品} {邮箱} {签名}

或点击下方 "AI 帮我写" 自动生成`}
            rows={8} style={{ width:'100%', padding:10, borderRadius:8, border:'1px solid #d1d5db', background:'#fff', fontSize:14, marginBottom:10, outline:'none' }} />

          {/* AI 生成选项 */}
          <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>AI 生成选项</span>
              <button type="button" onClick={handleAiGenerate} disabled={aiLoading}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 18px', borderRadius: 6, border: 'none', background: '#7c3aed', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                <Wand2 size={14} /> {aiLoading ? '生成中...' : 'AI 帮我写'}
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>语气：</span>
              {['formal','friendly','casual'].map(t => (
                <button key={t} type="button" style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #e5e7eb', cursor: 'pointer', background: aiOptions.tone === t ? '#2563eb' : '#fff', color: aiOptions.tone === t ? '#fff' : '#64748b' }} onClick={() => setAiOptions({...aiOptions, tone: t})}>
                  {t === 'formal' ? '正式商务' : t === 'friendly' ? '轻松友好' : '简洁直接'}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>长度：</span>
              {['short','medium','long'].map(l => (
                <button key={l} type="button" style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #e5e7eb', cursor: 'pointer', background: aiOptions.length === l ? '#2563eb' : '#fff', color: aiOptions.length === l ? '#fff' : '#64748b' }} onClick={() => setAiOptions({...aiOptions, length: l})}>
                  {l === 'short' ? '简短' : l === 'medium' ? '标准' : '详细'}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>附带：</span>
              {['catalog','sample','companyIntro'].map(k => (
                <button key={k} type="button" style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #e5e7eb', cursor: 'pointer', background: aiOptions[k] ? '#2563eb' : '#fff', color: aiOptions[k] ? '#fff' : '#64748b' }} onClick={() => setAiOptions({...aiOptions, [k]: !aiOptions[k]})}>
                  {k === 'catalog' ? '索取目录' : k === 'sample' ? '寄送样品' : '公司介绍'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" disabled={loading} style={{ background:'#2563eb',color:'#fff',border:'none',padding:'12px 28px',borderRadius:8,cursor:'pointer',fontSize:15,fontWeight:600 }}>
              {loading ? '发送中...' : '发送'}
            </button>
            <button type="button" onClick={() => setPreviewOpen(true)}
              style={{ padding:'12px 20px',borderRadius:8,border:'1px solid #d1d5db',background:'#fff',color:'#64748b',fontSize:14,cursor:'pointer' }}>
              预览
            </button>
            <a href="/search" style={{ padding:'12px 20px',borderRadius:8,border:'1px solid #e5e7eb',color:'#64748b',fontSize:14,textDecoration:'none' }}>去搜索客户</a>
          </div>
        </form>
      ) : (
        <div>
          <textarea value={bulkText} onChange={e => setBulkText(e.target.value)}
            placeholder={`每行一个客户，逗号分隔：
buyer@example.com, John, ABC Corp, 采购咨询
info@import.com, Jane, XYZ Import

列格式：邮箱, 姓名, 公司, 主题, 正文
姓名/公司/主题/正文可留空，留空则使用上方表单的值
正文中可用 {客户姓名} {公司名} 变量自动替换`}
            rows={12} style={{ width:'100%', padding:10, borderRadius:8, border:'1px solid #d1d5db', background:'#fff', fontSize:13, fontFamily:'monospace', marginBottom:10, outline:'none' }} />
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
            : <div style={{ color: '#15803d' }}><CheckCircle size={16} style={{ marginRight: 4 }} />发送 {result.sent || 0} 封，失败 {result.failed || 0} 封
              {result.details && result.details.length > 0 && (
                <ul style={{ marginTop: 8, fontSize: 13, color: '#64748b' }}>
                  {result.details.map((r, i) => <li key={i}>{r.email}: {r.error || '已发送'}</li>)}
                </ul>
              )}
            </div>}
        </div>
      )}

      {/* 邮件预览弹窗 */}
      {previewOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setPreviewOpen(false)}>
          <div style={{ background: '#fff', borderRadius: 12, maxWidth: 650, width: '100%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>邮件预览</span>
              <button onClick={() => setPreviewOpen(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ marginBottom: 12, fontSize: 13, color: '#94a3b8' }}>
                <span style={{ fontWeight: 500 }}>From:</span> {signature ? signature.split('\n')[0] : '你的名称'} &lt;{form.email || 'your@email.com'}&gt;<br/>
                <span style={{ fontWeight: 500 }}>To:</span> {form.email || '客户邮箱'}<br/>
                <span style={{ fontWeight: 500 }}>Subject:</span> {form.subject || 'Business Inquiry'}
              </div>
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: 16, fontSize: 14, color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
                {applyTemplate(form.body) || <span style={{ color: '#94a3b8' }}>邮件正文为空，请先填写内容或使用 AI 生成</span>}
              </div>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setPreviewOpen(false)} style={{ padding: '8px 20px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' }}>关闭</button>
              <button onClick={() => { setPreviewOpen(false); document.querySelector('button[type="submit"]')?.click(); }}
                style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>确认发送</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
