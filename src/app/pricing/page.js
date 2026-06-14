'use client';
import { useState } from 'react';

export default function Pricing() {
  const [billing, setBilling] = useState('monthly');
  const [showContact, setShowContact] = useState(false);

  const plans = [
    {
      name: '免费版', price: 0, yearlyPrice: 0, period: '永久免费',
      features: [
        { text: '25 次搜索/月', included: true },
        { text: '邮箱查找', included: true },
        { text: '邮箱验证', included: false },
        { text: '自动发信（5封/天）', included: true },
        { text: '自动跟进', included: false },
        { text: '回复追踪', included: true },
        { text: '数据分析看板', included: false },
        { text: '自定义品类', included: false },
      ],
      btn: '免费注册', href: '/register', primary: false, style: 'outline',
    },
    {
      name: '专业版', price: 199, yearlyPrice: 159, period: '/月',
      features: [
        { text: '500 次搜索/月', included: true, bold: true },
        { text: '邮箱查找 + 验证', included: true },
        { text: '自动发信（无限制）', included: true },
        { text: '自动跟进', included: true },
        { text: '回复追踪', included: true },
        { text: '数据分析看板', included: true },
        { text: '自定义品类', included: true },
        { text: 'API 接入', included: false },
      ],
      btn: '立即升级', onClick: () => setShowContact(true), primary: true, style: 'primary',
    },
    {
      name: '企业版', price: 699, yearlyPrice: 559, period: '/月',
      features: [
        { text: '2000 次搜索/月', included: true, bold: true },
        { text: '专业版全部功能', included: true },
        { text: 'API 接入', included: true },
        { text: '一对一专属客服', included: true },
        { text: '定制化需求', included: true },
        { text: '优先数据更新', included: true },
        { text: '团队账号（最多10人）', included: true },
      ],
      btn: '联系客服', onClick: () => setShowContact(true), primary: false, style: 'dark',
    },
  ];

  // 功能对比表数据
  const compareRows = [
    { feature: '每月搜索次数', free: '25 次', pro: '500 次', ent: '2000 次' },
    { feature: '邮箱查找', free: true, pro: true, ent: true },
    { feature: '邮箱验证（有效性检测）', free: false, pro: true, ent: true },
    { feature: '自动发信', free: '5 封/天', pro: '无限制', ent: '无限制' },
    { feature: '自动跟进（未回复提醒）', free: false, pro: true, ent: true },
    { feature: '回复追踪', free: true, pro: true, ent: true },
    { feature: '数据分析看板', free: false, pro: true, ent: true },
    { feature: '自定义品类', free: false, pro: true, ent: true },
    { feature: 'API 接入', free: false, pro: false, ent: true },
    { feature: '专属客服', free: false, pro: false, ent: true },
    { feature: '团队账号', free: '1 人', pro: '1 人', ent: '最多 10 人' },
  ];

  function CellValue({ val }) {
    if (val === true) return <span style={{ color: '#22c55e', fontWeight: 700, fontSize: 16 }}>✓</span>;
    if (val === false) return <span style={{ color: '#d1d5db' }}>✗</span>;
    return <span>{val}</span>;
  }

  return (
    <div style={{ maxWidth: 960, margin: '40px auto', padding: '0 20px', textAlign: 'center' }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>选择适合你的方案</h1>
      <p style={{ fontSize: 16, color: '#94a3b8', marginBottom: 32 }}>按月付费，随时取消。注册即送免费额度。</p>

      {/* 月付/年付切换 */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 40, background: '#f1f5f9', borderRadius: 8, padding: 4, width: 'fit-content', margin: '0 auto 40px' }}>
        <button onClick={() => setBilling('monthly')}
          style={{ padding: '10px 24px', fontSize: 14, border: 'none', borderRadius: 6, cursor: 'pointer', background: billing === 'monthly' ? '#fff' : 'transparent', color: billing === 'monthly' ? '#0f172a' : '#64748b', fontWeight: billing === 'monthly' ? 600 : 400, boxShadow: billing === 'monthly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
          月付
        </button>
        <button onClick={() => setBilling('yearly')}
          style={{ padding: '10px 24px', fontSize: 14, border: 'none', borderRadius: 6, cursor: 'pointer', background: billing === 'yearly' ? '#fff' : 'transparent', color: billing === 'yearly' ? '#0f172a' : '#64748b', fontWeight: billing === 'yearly' ? 600 : 400, boxShadow: billing === 'yearly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
          年付 <span style={{ fontSize: 11, background: '#22c55e', color: '#fff', padding: '2px 6px', borderRadius: 4, marginLeft: 4 }}>省20%</span>
        </button>
      </div>

      {/* 定价卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, alignItems: 'start' }}>
        {plans.map(p => {
          const displayPrice = billing === 'yearly' && p.yearlyPrice > 0 ? p.yearlyPrice : p.price;
          const yearlyNote = billing === 'yearly' && p.yearlyPrice > 0 ? `年付 ¥${p.yearlyPrice * 12}，省 ¥${(p.price - p.yearlyPrice) * 12}` : '';

          return (
            <div key={p.name} style={{
              background: '#fff', borderRadius: 12, padding: 32,
              border: p.primary ? '2px solid #2563eb' : '1px solid #e5e7eb',
              boxShadow: p.primary ? '0 8px 32px rgba(37,99,235,0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
              position: 'relative',
              transform: p.primary ? 'scale(1.03)' : 'none',
            }}>
              {p.primary && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#2563eb', color: '#fff', padding: '4px 16px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                  🔥 最受欢迎
                </div>
              )}
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: p.primary ? '12px 0 8px' : '0 0 8px' }}>{p.name}</h3>
              <div style={{ fontSize: 42, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
                ¥{displayPrice}
                {displayPrice > 0 && <span style={{ fontSize: 16, fontWeight: 400, color: '#94a3b8' }}>{p.period}</span>}
              </div>
              {billing === 'yearly' && p.price > 0 && (
                <div style={{ fontSize: 14, color: '#94a3b8' }}>
                  <span style={{ textDecoration: 'line-through', color: '#d1d5db' }}>¥{p.price}/月</span>
                </div>
              )}
              <div style={{ fontSize: 13, color: '#22c55e', marginBottom: 24, minHeight: 20 }}>{yearlyNote}</div>
              <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 24 }}>{p.price === 0 ? p.period : billing === 'monthly' ? '按月付费' : ''}</div>

              <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', marginBottom: 28 }}>
                {p.features.map(f => (
                  <li key={f.text} style={{ padding: '8px 0', fontSize: 14, color: f.included ? '#475569' : '#d1d5db', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: f.included ? '#22c55e' : '#d1d5db', fontWeight: 700, fontSize: 14, width: 16 }}>{f.included ? '✓' : '✗'}</span>
                    <span style={{ fontWeight: f.bold ? 600 : 400 }}>{f.text}</span>
                  </li>
                ))}
              </ul>

              {p.onClick ? (
                <button onClick={p.onClick} style={{
                  display: 'block', width: '100%', padding: 12, borderRadius: 8, fontSize: 15, fontWeight: 600, textAlign: 'center', cursor: 'pointer',
                  background: p.style === 'dark' ? '#0f172a' : p.style === 'primary' ? '#2563eb' : 'transparent',
                  color: p.style === 'outline' ? '#2563eb' : '#fff',
                  border: p.style === 'outline' ? '2px solid #2563eb' : 'none',
                  boxShadow: p.style === 'primary' ? '0 2px 8px rgba(37,99,235,0.2)' : 'none',
                }}>{p.btn}</button>
              ) : (
                <a href={p.href} style={{
                  display: 'block', padding: 12, borderRadius: 8, textDecoration: 'none', fontSize: 15, fontWeight: 600, textAlign: 'center',
                  background: p.style === 'dark' ? '#0f172a' : p.style === 'primary' ? '#2563eb' : 'transparent',
                  color: p.style === 'outline' ? '#2563eb' : '#fff',
                  border: p.style === 'outline' ? '2px solid #2563eb' : 'none',
                  boxShadow: p.style === 'primary' ? '0 2px 8px rgba(37,99,235,0.2)' : 'none',
                }}>{p.btn}</a>
              )}
            </div>
          );
        })}
      </div>

      {/* 功能对比表 */}
      <div style={{ marginTop: 64, overflowX: 'auto' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>功能详细对比</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, color: '#0f172a', borderBottom: '2px solid #e5e7eb' }}>功能</th>
              <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, color: '#0f172a', borderBottom: '2px solid #e5e7eb' }}>免费版</th>
              <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, color: '#2563eb', borderBottom: '2px solid #e5e7eb' }}>专业版</th>
              <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, color: '#0f172a', borderBottom: '2px solid #e5e7eb' }}>企业版</th>
            </tr>
          </thead>
          <tbody>
            {compareRows.map((row, i) => (
              <tr key={row.feature} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, color: '#333' }}>{row.feature}</td>
                <td style={{ padding: '12px 16px', textAlign: 'center', color: '#64748b' }}><CellValue val={row.free} /></td>
                <td style={{ padding: '12px 16px', textAlign: 'center', color: '#64748b' }}><CellValue val={row.pro} /></td>
                <td style={{ padding: '12px 16px', textAlign: 'center', color: '#64748b' }}><CellValue val={row.ent} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 企微客服弹窗 */}
      {showContact && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => setShowContact(false)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 340, width: '90%', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px', color: '#0f172a' }}>联系专属客服</h3>
            <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 16px' }}>扫码添加企业微信，获取企业版详情和定制方案</p>
            <img src="/78993206bd28b9b4f6a7a2929c33855b.jpg" alt="企业微信二维码" style={{ width: '100%', borderRadius: 12, display: 'block' }} />
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '12px 0 8px' }}>工作日 9:00-18:00 在线，1小时内回复</p>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>支持微信/支付宝付款，可开票</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Metadata is in layout.js
