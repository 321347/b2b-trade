'use client';
import { useState, useEffect } from 'react';

const PRESETS = [
  { label: 'QQ邮箱', host: 'smtp.qq.com', port: 465 },
  { label: '163邮箱', host: 'smtp.163.com', port: 465 },
  { label: 'Gmail', host: 'smtp.gmail.com', port: 465 },
  { label: 'Outlook', host: 'smtp.office365.com', port: 587 },
  { label: '企业微信', host: 'smtp.exmail.qq.com', port: 465 },
];

const TUTORIALS = {
  qq: {
    title: 'QQ邮箱',
    host: 'smtp.qq.com',
    port: 465,
    steps: [
      '登录 QQ邮箱网页版 <a href="https://mail.qq.com" target="_blank" style="color:#2563eb">mail.qq.com</a>',
      '点击顶部 <b>设置</b> → <b>账户</b> 标签',
      '往下找到 <b>POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务</b>',
      '点击 <b>开启 POP3/SMTP 服务</b>（如已开启跳过）',
      '按提示发送短信验证，验证后会显示一个<b>16位授权码</b>',
      '将授权码填入本页的 <b>SMTP 密码/授权码</b> 字段',
    ],
    note: 'QQ邮箱的密码不是登录密码，是上一步生成的 16 位授权码。每次生成新的后旧的失效。',
  },
  '163': {
    title: '163/126 网易邮箱',
    host: 'smtp.163.com',
    port: 465,
    steps: [
      '登录网页版邮箱',
      '点击 <b>设置</b> → <b>POP3/SMTP/IMAP</b>',
      '勾选开启 <b>SMTP 服务</b>',
      '系统会要求你设置一个<b>客户端授权密码</b>（不同于登录密码）',
      '将授权密码填入本页的 <b>SMTP 密码/授权码</b> 字段',
    ],
    note: '126邮箱用 smtp.126.com，其他配置相同。',
  },
  gmail: {
    title: 'Gmail（Google 邮箱）',
    host: 'smtp.gmail.com',
    port: 465,
    steps: [
      '打开 Google 账号管理：<a href="https://myaccount.google.com/security" target="_blank" style="color:#2563eb">myaccount.google.com/security</a>',
      '开启 <b>两步验证</b>（如未开启）',
      '开启后，在同一页面搜索 <b>"应用专用密码"</b>（App Passwords）',
      '选择应用 = <b>邮件</b>，设备 = <b>其他</b>，输入任意名称即可',
      'Google 会生成一个 16 位密码（格式：xxxx-xxxx-xxxx-xxxx）',
      '将应用专用密码填入本页的 <b>SMTP 密码/授权码</b> 字段',
    ],
    note: '如在中国大陆使用 Gmail SMTP，可能需要稳定的网络环境。端口用 465（SSL）或 587（TLS）均可。',
  },
  outlook: {
    title: 'Outlook / Hotmail',
    host: 'smtp.office365.com',
    port: 587,
    steps: [
      '登录 Outlook 网页版',
      '如未开启两步验证，建议先开启以提高安全性',
      '前往 Microsoft 账号安全设置，搜索<b>"应用密码"</b>',
      '生成一个新应用密码',
      '填入本页：SMTP 服务器 = smtp.office365.com，端口 = 587',
    ],
    note: 'Outlook 使用 STARTTLS（端口 587），不是 SSL（端口 465）。如果 587 不通，试试 465。',
  },
  exmail: {
    title: '企业微信 / 腾讯企业邮箱',
    host: 'smtp.exmail.qq.com',
    port: 465,
    steps: [
      '登录企业微信管理后台或企业邮箱网页版',
      '进入 <b>设置</b> → <b>客户端设置</b>',
      '开启 <b>SMTP 服务</b>',
      '系统会生成一个<b>客户端密码/授权码</b>',
      '将授权码填入本页',
    ],
    note: '企业邮箱可能有每日发送上限（通常 500-1000 封），大量发送前确认额度。',
  },
};

export default function EmailSettings() {
  const [user, setUser] = useState(null);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState({
    host: '', port: 465, user: '', pass: '', fromName: '',
  });

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) { window.location.href = '/login'; return; }
    setUser(JSON.parse(u));
    const cfg = localStorage.getItem('smtpConfig');
    if (cfg) setForm(JSON.parse(cfg));
  }, []);

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  function applyPreset(p) {
    setForm(prev => ({ ...prev, host: p.host, port: p.port }));
    setSaved(false);
  }

  function applyTutorial(key) {
    const t = TUTORIALS[key];
    setForm(prev => ({ ...prev, host: t.host, port: t.port }));
    setExpanded(expanded === key ? null : key);
  }

  function handleSave() {
    localStorage.setItem('smtpConfig', JSON.stringify(form));
    setSaved(true);
  }

  async function handleTest() {
    setTesting(true); setTestResult(null);
    try {
      const r = await fetch('/api/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
        body: JSON.stringify({ smtp: form, to: user?.email }),
      });
      const d = await r.json();
      setTestResult(d.ok ? 'success' : 'fail');
    } catch { setTestResult('fail'); }
    setTesting(false);
  }

  if (!user) return null;

  const inp = (field, placeholder, type = 'text') => (
    <input
      type={type}
      value={form[field]}
      onChange={e => update(field, type === 'number' ? parseInt(e.target.value) || '' : e.target.value)}
      placeholder={placeholder}
      style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, outline: 'none', background: '#fff', color: '#0f172a' }}
    />
  );

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px 80px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>邮箱设置</h1>
      <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 28 }}>
        配置你的公司邮箱，开发信将以你的名义一键发送，客户回复直接到你邮箱。
      </p>

      {/* Form */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e5e5', padding: 20, marginBottom: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>SMTP 配置</div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => applyPreset(p)}
              style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: form.host === p.host ? '#0f172a' : '#fff', color: form.host === p.host ? '#fff' : '#64748b', cursor: 'pointer', fontSize: 12 }}>
              {p.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>发件人名称</div>
            {inp('fromName', '如：张三 · XX科技有限公司')}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>SMTP 服务器</div>
              {inp('host', 'smtp.qq.com')}
            </div>
            <div style={{ width: 100 }}>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>端口</div>
              <input
                type="number"
                value={form.port}
                onChange={e => update('port', parseInt(e.target.value) || 465)}
                placeholder="465"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, outline: 'none', background: '#fff', color: '#0f172a' }}
              />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>邮箱地址（完整邮箱）</div>
            {inp('user', 'you@yourcompany.com')}
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>SMTP 密码 / 授权码</div>
            {inp('pass', '一般为授权码，非登录密码', 'password')}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={handleSave}
            style={{ flex: 1, padding: '11px', borderRadius: 8, background: '#0f172a', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            {saved ? '已保存 ✓' : '保存配置'}
          </button>
          <button onClick={handleTest} disabled={testing || !form.host || !form.user || !form.pass}
            style={{ padding: '11px 24px', borderRadius: 8, border: '1px solid #0f172a', background: '#fff', color: '#0f172a', fontSize: 14, fontWeight: 600, cursor: (!form.host || !form.user || !form.pass) ? 'default' : 'pointer', opacity: (!form.host || !form.user || !form.pass) ? 0.4 : 1 }}>
            {testing ? '测试中...' : '发送测试'}
          </button>
        </div>

        {testResult === 'success' && (
          <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 6, background: '#f0fdf4', color: '#16a34a', fontSize: 13 }}>
            测试邮件发送成功，请检查收件箱（可能在垃圾邮件中）。
          </div>
        )}
        {testResult === 'fail' && (
          <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 6, background: '#fef2f2', color: '#dc2626', fontSize: 13 }}>
            发送失败，请检查 SMTP 服务器、端口和授权码是否正确。常见原因：密码用的是登录密码而非授权码。
          </div>
        )}
        {saved && !testResult && (
          <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 6, background: '#f0fdf4', color: '#16a34a', fontSize: 13 }}>
            配置已保存。建议先发送一封测试邮件验证配置是否正确。
          </div>
        )}
      </div>

      {/* Tutorials */}
      <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>各大邮箱配置教程</div>
      <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
        点击对应的邮箱类型查看详细步骤，同时会自动填入 SMTP 服务器和端口。
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Object.entries(TUTORIALS).map(([key, t]) => {
          const isOpen = expanded === key;
          return (
            <div key={key} style={{ background: '#fff', borderRadius: 8, border: isOpen ? '2px solid #0f172a' : '1px solid #e5e5e5', overflow: 'hidden', transition: 'border 0.2s' }}>
              <button onClick={() => applyTutorial(key)}
                style={{ width: '100%', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                <span>{t.title}</span>
                <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>{t.host}:{t.port}</span>
              </button>
              {isOpen && (
                <div style={{ padding: '0 18px 18px', borderTop: '1px solid #f3f3f3' }}>
                  <ol style={{ margin: '12px 0 0', padding: '0 0 0 18px', fontSize: 13, color: '#475569', lineHeight: 2.2 }}>
                    {t.steps.map((s, i) => (
                      <li key={i} dangerouslySetInnerHTML={{ __html: s }} />
                    ))}
                  </ol>
                  {t.note && (
                    <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 6, background: '#fffbeb', fontSize: 12, color: '#92400e', lineHeight: 1.7 }}>
                      {t.note}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
