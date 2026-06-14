'use client';
import { useState, useEffect, useRef } from 'react';
import { maskEmail, loadHistory, saveHistory, getSmtp, authHeaders, MARKETS } from '@/lib/utils';

const DEFAULT_TAGS = ['不锈钢压蒜器','宠物玩具','化妆刷套装','USB充电器','瑜伽垫','冰箱贴','毛绒玩具','蓝牙耳机','手机支架'];

export default function SearchPage({ variant = 'home' }) {
  const [user, setUser] = useState(null);
  const [query, setQuery] = useState('');
  const [market, setMarket] = useState('英国');
  const [companies, setCompanies] = useState([]);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState([]);
  const [showLoginTip, setShowLoginTip] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [history, setHistory] = useState([]);
  const [quickTags, setQuickTags] = useState(DEFAULT_TAGS);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [smtpConfigured, setSmtpConfigured] = useState(false);
  const [quota, setQuota] = useState(null);
  const inputRef = useRef(null);
  const isHome = variant === 'home';

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) setUser(JSON.parse(u));
    setHistory(loadHistory());
    setSmtpConfigured(!!getSmtp());
  }, []);

  async function handleSearch(e) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true); setSuggestions([]); setCopiedAll(false);
    saveHistory(q); setHistory(loadHistory());

    const r = await fetch(`/api/industry-search?q=${encodeURIComponent(q)}&market=${market}`);
    const d = await r.json();
    if (d.needLogin) { setShowLoginTip(true); setLoading(false); return; }
    setCompanies(d.companies);
    setSuggestions(d.suggestions || []);
    if (d.quota) setQuota(d.quota);

    if (d.companies.length > 0) {
      setQuickTags(prev => { const next = [q, ...prev.filter(t => t !== q)]; return next.slice(0, 9); });
      const generated = await Promise.all(d.companies.map(c =>
        fetch('/api/generate-email', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ company: c.company, industry: q, market, domain: c.domain, contactName: (c.emails[0] || '').split('@')[0].split('.')[0] }) }).then(r => r.json())
      ));
      setEmails(generated.map(g => ({ ...g, customSubject: g.subject, customBody: g.body })));
    }
    setLoading(false);
  }

  function updateEmail(i, field, value) { const next = [...emails]; next[i] = { ...next[i], [field]: value }; setEmails(next); }

  function handleLogin() {
    localStorage.setItem('redirect', '/?q=' + encodeURIComponent(query));
    window.location.href = '/register';
  }

  async function handleSend() {
    if (!user) { setShowLoginTip(true); return; }
    const smtp = getSmtp();
    if (!smtp) { window.location.href = '/email-settings'; return; }
    const tasks = [];
    companies.forEach((c, i) => { c.emails.forEach(email => { tasks.push({ to: email, company: c.company, subject: emails[i]?.customSubject, body: emails[i]?.customBody }); }); });
    if (tasks.length === 0) return;
    setSending(true); setSent([]);
    const results = [];
    for (const t of tasks) {
      try {
        const r = await fetch('/api/send', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ ...t, smtp }) });
        const d = await r.json();
        results.push({ email: t.to, status: d.ok ? 'ok' : 'fail' });
      } catch { results.push({ email: t.to, status: 'fail' }); }
      setSent([...results]);
      await new Promise(r => setTimeout(r, 2000));
    }
    setSending(false);
  }

  function copyEmail(i, email) {
    const e = emails[i];
    navigator.clipboard.writeText(`To: ${email}\nSubject: ${e?.customSubject || ''}\n\n${e?.customBody || ''}`).then(() => {
      setCopiedIdx(i); setTimeout(() => setCopiedIdx(null), 2000);
    });
  }

  function copyAll() {
    const text = companies.map((c, i) => {
      const e = emails[i];
      return `=== ${c.company} (${c.domain}) ===\nTo: ${c.emails.join(', ')}\nSubject: ${e?.customSubject || ''}\n\n${e?.customBody || ''}\n`;
    }).join('\n---\n\n');
    navigator.clipboard.writeText(text).then(() => { setCopiedAll(true); setTimeout(() => setCopiedAll(false), 2000); });
  }

  const historyTerms = history.filter(t => t !== query);
  const hasResults = companies.length > 0;
  const isSending = sending && sent.length > 0;
  const sendDone = !sending && sent.length > 0;

  return (
    <div style={{ maxWidth: isHome ? 820 : 780, margin: '0 auto', padding: hasResults ? '32px 20px 80px' : isHome ? '80px 20px 80px' : '40px 20px 80px' }}>
      <div style={{ textAlign: 'center', marginBottom: hasResults ? 24 : isHome ? 0 : 32 }}>
        <h1 style={{ fontSize: hasResults ? 22 : isHome ? 36 : 26, fontWeight: 800, color: '#0f172a', margin: '0 0 12px', transition: isHome ? 'font-size 0.3s' : 'none' }}>
          {isHome ? (hasResults ? '搜索海外采购商' : '搜索海外采购商，获取决策人邮箱') : '搜索海外采购商'}
        </h1>
        {isHome && !hasResults && <p style={{ fontSize: 15, color: '#64748b', maxWidth: 480, margin: '0 auto 28px' }}>
          {user
            ? `Hi, ${user.name}${quota ? `（剩余 ${quota.remaining} 次）` : ''} — 输入产品名，匹配正在采购的海外公司`
            : '输入你的产品，找到正在采购的海外公司。邮箱打码，注册查看。'}
        </p>}
        {!isHome && <p style={{ fontSize: 14, color: '#94a3b8', margin: '0 0 24px' }}>{user ? `Hi, ${user.name}${quota ? '（剩余 ' + quota.remaining + ' 次）' : ''}` : '输入你的产品，找到正在采购的海外公司'}</p>}

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, maxWidth: 520, margin: '0 auto' }}>
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
            placeholder="输入你的产品，如：压蒜器、宠物玩具、瑜伽垫..."
            style={{ flex: 1, padding: isHome ? '14px 20px' : '12px 18px', borderRadius: isHome ? 10 : 8, border: '2px solid ' + (isHome ? '#d1d5db' : '#e5e5e5'), fontSize: isHome ? 16 : 15, outline: 'none', background: '#fff', color: '#0f172a' }}
            onFocus={e => e.target.style.borderColor = '#0f172a'} onBlur={e => e.target.style.borderColor = isHome ? '#d1d5db' : '#e5e5e5'} autoFocus />
          <select value={market} onChange={e => setMarket(e.target.value)}
            style={{ padding: isHome ? '14px 8px' : '12px 8px', borderRadius: isHome ? 10 : 8, border: '2px solid ' + (isHome ? '#d1d5db' : '#e5e5e5'), background: '#fff', fontSize: 14, color: '#64748b', minWidth: 80, cursor: 'pointer' }}>
            {MARKETS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <button type="submit" disabled={loading}
            style={{ padding: isHome ? '14px 28px' : '12px 24px', borderRadius: isHome ? 10 : 8, background: '#0f172a', color: '#fff', border: 'none', fontSize: isHome ? 15 : 14, fontWeight: isHome ? 700 : 600, cursor: 'pointer', whiteSpace: 'nowrap', opacity: loading ? 0.6 : 1 }}>
            {loading ? '搜索中' : '搜索'}
          </button>
        </form>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 16 }}>
          {quickTags.map(t => (
            <button key={t} onClick={() => { setQuery(t); inputRef.current?.focus(); }}
              style={{ padding: '5px 16px', borderRadius: 20, border: '1px solid #e5e5e5', background: query === t ? '#0f172a' : '#fff', cursor: 'pointer', fontSize: 13, color: query === t ? '#fff' : '#64748b' }}>{t}</button>
          ))}
        </div>

        {historyTerms.length > 0 && !hasResults && (
          <div style={{ marginTop: 14, fontSize: 12, color: '#94a3b8' }}>
            最近搜索：{historyTerms.slice(0, 5).map(t => (
              <button key={t} onClick={() => { setQuery(t); }} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 12, padding: '0 4px', textDecoration: 'underline' }}>{t}</button>
            ))}
          </div>
        )}

        {isHome && !user && !hasResults && <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 20 }}>注册即送 25 次免费搜索</p>}
      </div>

      {showLoginTip && (
        <div style={{ textAlign: 'center', padding: 24, background: '#fafafa', borderRadius: 8, border: '1px solid #e5e5e5', marginBottom: 20 }}>
          <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 12px' }}>注册即可查看完整邮箱</p>
          <button onClick={handleLogin} style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '10px 28px', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>免费注册</button>
        </div>
      )}

      {loading && <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>正在匹配采购商...</div>}

      {!loading && companies.length === 0 && suggestions.length > 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>没有找到 "{query}" 相关公司，试试以下产品词：</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {suggestions.map(s => (
              <button key={s} onClick={() => { setQuery(s); }} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #0f172a', background: '#fff', cursor: 'pointer', fontSize: 14, color: '#0f172a', fontWeight: 500 }}>{s}</button>
            ))}
          </div>
        </div>
      )}

      {isSending && (
        <div style={{ textAlign: 'center', padding: '24px 20px', marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>正在发送... {sent.filter(s => s.status === 'ok').length}/{sent.length}</div>
          <div style={{ width: '100%', height: 4, background: '#f3f3f3', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#0f172a', borderRadius: 2, transition: 'width 0.3s', width: `${(sent.length / (companies.reduce((a, c) => a + c.emails.length, 0))) * 100}%` }} />
          </div>
        </div>
      )}

      {sendDone && (
        <div style={{ textAlign: 'center', padding: '20px', marginBottom: 16, background: '#f0fdf4', borderRadius: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#16a34a' }}>发送完成：{sent.filter(s => s.status === 'ok').length} 成功</span>
          {sent.filter(s => s.status === 'fail').length > 0 && <span style={{ fontSize: 13, color: '#94a3b8', marginLeft: 8 }}>{sent.filter(s => s.status === 'fail').length} 失败</span>}
        </div>
      )}

      {hasResults && !loading && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>
              <button onClick={() => { setCompanies([]); setSent([]); }} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 13, padding: 0, marginRight: 8 }}>← 返回</button>
              "{query}" · {companies.length} 家公司
            </span>
          </div>

          {companies.map((c, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e5e5', marginBottom: 10, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: user ? '1px solid #f3f3f3' : 'none' }}>
                <div>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{c.company}</span>
                  <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 10 }}>{c.domain} · {c.market}</span>
                </div>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>{c.emails.length} 人</span>
              </div>

              {user ? (
                <div style={{ padding: '6px 16px 12px' }}>
                  {c.emails.map((email, j) => (
                    <div key={j} style={{ padding: '6px 0', borderBottom: j < c.emails.length - 1 ? '1px solid #fafafa' : 'none' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>{email}</div>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                        <input value={emails[i]?.customSubject || ''} onChange={e => updateEmail(i, 'customSubject', e.target.value)}
                          style={{ flex: 1, padding: '5px 8px', borderRadius: 4, border: '1px solid #e5e5e5', fontSize: 12, outline: 'none', color: '#475569' }} placeholder="主题" />
                        <button onClick={async () => {
                          const r = await fetch('/api/generate-email', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ company: c.company, industry: query, market, domain: c.domain, contactName: email.split('@')[0].split('.')[0] }) });
                          const d = await r.json(); updateEmail(i, 'customSubject', d.subject); updateEmail(i, 'customBody', d.body);
                        }} style={{ background: '#f5f5f5', border: 'none', color: '#64748b', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 11, whiteSpace: 'nowrap' }}>AI重写</button>
                        <button onClick={() => copyEmail(i, email)}
                          style={{ background: copiedIdx === i ? '#16a34a' : '#f5f5f5', border: 'none', color: copiedIdx === i ? '#fff' : '#64748b', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 11, whiteSpace: 'nowrap' }}>
                          {copiedIdx === i ? '已复制' : '复制'}
                        </button>
                      </div>
                      <textarea value={emails[i]?.customBody || ''} onChange={e => updateEmail(i, 'customBody', e.target.value)} rows={3}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #e5e5e5', fontSize: 12, outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5, color: '#475569' }} placeholder="邮件正文" />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '10px 16px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {c.emails.map((email, j) => (
                    <span key={j} style={{ padding: '5px 12px', borderRadius: 6, background: '#f5f5f5', fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>{maskEmail(email)}</span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {user && (
            <div style={{ textAlign: 'center', marginTop: 20, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              {smtpConfigured ? (
                <button onClick={handleSend} disabled={sending}
                  style={{ padding: '12px 40px', borderRadius: 8, border: 'none', fontSize: 14, fontWeight: 700, cursor: sending ? 'default' : 'pointer', background: sending ? '#d1d5db' : '#0f172a', color: '#fff' }}>
                  {sending ? '发送中...' : `一键发送 ${companies.reduce((a, c) => a + c.emails.length, 0)} 封开发信`}
                </button>
              ) : (
                <a href="/email-settings"
                  style={{ padding: '12px 40px', borderRadius: 8, border: '2px dashed #d1d5db', background: '#fafafa', color: '#64748b', fontSize: 14, fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}>
                  配置邮箱后一键发送 →
                </a>
              )}
              <button onClick={copyAll}
                style={{ padding: '12px 24px', borderRadius: 8, border: '1px solid #e5e5e5', background: copiedAll ? '#16a34a' : '#fff', color: copiedAll ? '#fff' : '#64748b', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                {copiedAll ? '已复制 ✓' : '复制全部（备用）'}
              </button>
            </div>
          )}

          {!user && companies.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: 28, padding: '24px', background: '#fafafa', borderRadius: 8, border: '1px solid #e5e5e5' }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>注册查看完整邮箱并发送开发信</div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>注册即送 25 次免费搜索</div>
              <button onClick={handleLogin} style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '12px 36px', borderRadius: 6, cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>免费注册</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
