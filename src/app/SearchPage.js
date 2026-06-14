'use client';
import { useState, useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { maskEmail, loadHistory, saveHistory, authHeaders, MARKETS, INDUSTRY_GROUPS } from '@/lib/utils';

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
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [smtpConfigured, setSmtpConfigured] = useState(false);
  const [quota, setQuota] = useState(null);
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [showCustom, setShowCustom] = useState(true);
  const inputRef = useRef(null);
  const isHome = variant === 'home';

  const [userPlan, setUserPlan] = useState('free');

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) {
      const parsed = JSON.parse(u);
      setUser(parsed);
      const plan = parsed.user_metadata?.plan || 'free';
      setUserPlan(plan);
      fetch('/api/smtp-config', { headers: authHeaders() }).then(r => r.json()).then(d => setSmtpConfigured(!!d.config));
      // 从 Supabase 同步搜索历史
      fetch('/api/user/history', { headers: authHeaders() }).then(r => r.json()).then(d => {
        if (d.history?.length > 0) {
          const local = loadHistory();
          const merged = [...new Set([...local, ...d.history])].slice(0, 12);
          localStorage.setItem('searchHistory', JSON.stringify(merged));
        }
      }).catch(() => {});
    }
  }, []);

  async function doSearch(q) {
    if (!q) return;
    setQuery(q);
    setLoading(true); setSuggestions([]); setCopiedAll(false);
    saveHistory(q);
    fetch('/api/user/history', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ history: loadHistory() }) }).catch(() => {});
    const r = await fetch(`/api/industry-search?q=${encodeURIComponent(q)}&market=${market}`);
    const d = await r.json();
    if (d.needLogin) { setShowLoginTip(true); setLoading(false); return; }
    setCompanies(d.companies);
    setSuggestions(d.suggestions || []);
    if (d.quota) setQuota(d.quota);
    if (d.companies.length > 0 && user) {
      const generated = await Promise.all(d.companies.map(c =>
        fetch('/api/generate-email', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ company: c.company, industry: q, market, domain: c.domain, contactName: (c.emails[0] || '').split('@')[0].split('.')[0] }) }).then(r => r.json())
      ));
      setEmails(generated.map(g => ({ ...g, customSubject: g.subject, customBody: g.body })));
    }
    setLoading(false);
  }

  function handleIndustryClick(ind) {
    setSelectedIndustry(selectedIndustry?.key === ind.key ? null : ind);
    setShowCustom(false);
  }

  function handleProductClick(product) {
    doSearch(product);
  }

  function handleCustomSearch(e) {
    e.preventDefault();
    const q = query.trim();
    if (q) doSearch(q);
  }

  function updateEmail(i, field, value) { const next = [...emails]; next[i] = { ...next[i], [field]: value }; setEmails(next); }

  function handleLogin() {
    localStorage.setItem('redirect', '/?q=' + encodeURIComponent(query));
    window.location.href = '/register';
  }

  async function handleSend() {
    if (!user) { setShowLoginTip(true); return; }
    if (!smtpConfigured) { window.location.href = '/email-settings'; return; }
    const targets = [];
    companies.forEach((c, i) => { c.emails.forEach(email => { targets.push({ email, company: c.company, subject: emails[i]?.customSubject, body: emails[i]?.customBody }); }); });
    if (targets.length === 0) return;
    setSending(true); setSent([]);
    const results = [];
    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      try {
        const r = await fetch('/api/send', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ to: t.email, name: t.name, company: t.company, subject: t.subject, body: t.body }) });
        const d = await r.json();
        results.push({ email: t.email, status: d.ok ? 'ok' : 'fail' });
      } catch { results.push({ email: t.email, status: 'fail' }); }
      setSent([...results]);
      // 每封间隔 2-3 分钟
      if (i < targets.length - 1) await new Promise(r => setTimeout(r, 120000 + Math.random() * 60000));
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

  const hasResults = companies.length > 0;
  const isSending = sending && sent.length > 0;
  const sendDone = !sending && sent.length > 0;

  return (
    <div style={{ maxWidth: isHome ? 820 : 780, margin: '0 auto', padding: hasResults ? '32px 20px 80px' : '60px 20px 80px' }}>
      <div style={{ textAlign: 'center', marginBottom: hasResults ? 24 : 0 }}>
        <h1 style={{ fontSize: hasResults ? 22 : isHome ? 34 : 26, fontWeight: 800, color: '#0f172a', margin: '0 0 8px', transition: isHome ? 'font-size 0.3s' : 'none' }}>
          {isHome ? (hasResults ? '搜索海外采购商' : '搜索海外采购商，获取决策人邮箱') : '搜索海外采购商'}
        </h1>
        {isHome && !hasResults && <p style={{ fontSize: 15, color: '#64748b', maxWidth: 480, margin: '0 auto 6px' }}>
          {user ? `Hi, ${user.name}${quota ? `（剩余 ${quota.remaining} 次）` : ''}` : '选择你的行业，找到正在采购的海外公司'}
        </p>}
        {!isHome && !hasResults && <p style={{ fontSize: 14, color: '#94a3b8', margin: '0 0 16px' }}>{user ? `Hi, ${user.name}${quota ? '（剩余 ' + quota.remaining + ' 次）' : ''}` : '选择行业开始搜索'}</p>}

        {/* 行业卡片 */}
        {!hasResults && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 10, maxWidth: 560, margin: '24px auto' }}>
            {INDUSTRY_GROUPS.map(ind => (
              <button key={ind.key} onClick={() => handleIndustryClick(ind)}
                style={{
                  padding: '14px 8px', borderRadius: 10, border: selectedIndustry?.key === ind.key ? '2px solid #0f172a' : '1px solid #e5e5e5',
                  background: selectedIndustry?.key === ind.key ? '#0f172a' : '#fff', cursor: 'pointer', fontSize: 13,
                  color: selectedIndustry?.key === ind.key ? '#fff' : '#334155', fontWeight: selectedIndustry?.key === ind.key ? 600 : 400,
                  transition: 'all 0.15s',
                }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{ind.emoji}</div>
                <div>{ind.label}</div>
              </button>
            ))}
          </div>
        )}

        {/* 品类按钮 + 市场选择 */}
        {selectedIndustry && !hasResults && (
          <div style={{ marginTop: 8, marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 10 }}>{selectedIndustry.emoji} {selectedIndustry.label} · 热门产品（点一下直接搜）：</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 12 }}>
              {selectedIndustry.products.map(p => (
                <button key={p} onClick={() => handleProductClick(p)}
                  style={{ padding: '8px 16px', borderRadius: 20, border: '1px solid #d1d5db', background: query === p ? '#0f172a' : '#fff', color: query === p ? '#fff' : '#475569', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                  {p}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>目标市场：</span>
              <select value={market} onChange={e => setMarket(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', fontSize: 13, color: '#334155', cursor: 'pointer' }}>
                {MARKETS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* 自定义搜索 */}
        {!hasResults && (
          <div style={{ marginTop: selectedIndustry ? 0 : 8 }}>
            <button onClick={() => { setShowCustom(!showCustom); setSelectedIndustry(null); }}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}>
              {showCustom ? '收起' : '—— 或自定义搜索 ——'}
            </button>
            {showCustom && (
              <form onSubmit={handleCustomSearch} style={{ display: 'flex', gap: 8, maxWidth: 520, margin: '10px auto 0', alignItems: 'center' }}>
                <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="输入你的产品，如：压蒜器、宠物玩具..."
                  style={{ flex: 1, padding: '12px 16px', borderRadius: 8, border: '2px solid #e5e5e5', fontSize: 14, outline: 'none', background: '#fff', color: '#0f172a' }}
                  onFocus={e => e.target.style.borderColor = '#0f172a'} onBlur={e => e.target.style.borderColor = '#e5e5e5'} />
                <select value={market} onChange={e => setMarket(e.target.value)}
                  style={{ padding: '12px 8px', borderRadius: 8, border: '2px solid #e5e5e5', background: '#fff', fontSize: 13, color: '#334155', cursor: 'pointer', minWidth: 80 }}>
                  {MARKETS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <button type="submit" disabled={loading}
                  style={{ padding: '12px 20px', borderRadius: 8, background: '#0f172a', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {loading ? '搜索中' : '搜索'}
                </button>
              </form>
            )}
          </div>
        )}

        {isHome && !user && !hasResults && <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 20 }}>注册即送 10 次免费搜索</p>}
      </div>

      {showLoginTip && (
        <div style={{ textAlign: 'center', padding: 24, background: '#fafafa', borderRadius: 8, border: '1px solid #e5e5e5', marginBottom: 20 }}>
          <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 12px' }}>注册即可查看完整邮箱</p>
          <button onClick={handleLogin} style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '10px 28px', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>免费注册</button>
        </div>
      )}

      {loading && <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>正在匹配采购商...</div>}

      {!loading && companies.length === 0 && suggestions.length > 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>没有找到 "{query}" 相关公司，试试以下产品词：</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {suggestions.map(s => (
              <button key={s} onClick={() => doSearch(s)} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #0f172a', background: '#fff', cursor: 'pointer', fontSize: 14, color: '#0f172a', fontWeight: 500 }}>{s}</button>
            ))}
          </div>
        </div>
      )}

      {sending && (
        <div style={{ textAlign: 'center', padding: '24px 20px', marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>正在发送 {sent.filter(s => s.status === 'ok').length}/{companies.reduce((a, c) => a + c.emails.length, 0)}</div>
          <div style={{ width: '100%', height: 4, background: '#f3f3f3', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#0f172a', borderRadius: 2, transition: 'width 0.3s', width: `${(sent.length / companies.reduce((a, c) => a + c.emails.length, 0)) * 100}%` }} />
          </div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>每封间隔 2-3 分钟 · 请勿关闭本页面</div>
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
              <button onClick={() => { setCompanies([]); setSent([]); setSelectedIndustry(null); }}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 13, padding: 0, marginRight: 8 }}>← 返回</button>
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

              {user && (userPlan === 'basic' || userPlan === 'pro' || userPlan === 'enterprise') ? (
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
                <div style={{ padding: '10px 16px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: user ? 8 : 0 }}>
                    {c.emails.map((email, j) => (
                      <span key={j} style={{ padding: '5px 12px', borderRadius: 6, background: '#f5f5f5', fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>{maskEmail(email)}</span>
                    ))}
                  </div>
                  {user && (userPlan === 'free' || userPlan === 'starter') && (
                    <a href="/pricing" style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none' }}>升级套餐查看完整邮箱 →</a>
                  )}
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
                {copiedAll ? <><Check size={14} /> 已复制</> : '复制全部（备用）'}
              </button>
            </div>
          )}

          {!user && companies.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: 28, padding: '24px', background: '#fafafa', borderRadius: 8, border: '1px solid #e5e5e5' }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>注册查看完整邮箱并发送开发信</div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>注册即送 10 次免费搜索</div>
              <button onClick={handleLogin} style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '12px 36px', borderRadius: 6, cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>免费注册</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
