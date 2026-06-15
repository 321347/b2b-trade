'use client';
import Link from 'next/link';
import { Globe, Frown, XCircle, CheckCircle } from 'lucide-react';
import { getIndustryBySlug, getAllIndustries } from '@/lib/industries';
import { IndustryIcon } from '@/lib/icon-map';

export default function IndustryPageContent({ slug }) {
  const industry = getIndustryBySlug(slug);
  if (!industry) {
    return <div style={{ padding: 40, textAlign: 'center' }}>品类未找到</div>;
  }

  const allIndustries = getAllIndustries();
  const relatedIndustries = industry.related
    .map(r => allIndustries.find(i => i.slug === r))
    .filter(Boolean);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
      {/* 页头 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
        <div style={{ fontSize: 48, width: 80, height: 80, background: '#eff6ff', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IndustryIcon slug={industry.slug} size={32} />
        </div>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
            {industry.zh}外贸客户搜索
          </h1>
          <p style={{ fontSize: 15, color: '#94a3b8', margin: 0 }}>
            精准查找海外{industry.zh}采购商和进口商联系方式
          </p>
        </div>
      </div>

      {/* 数据统计 */}
      <div style={{ display: 'flex', gap: 24, background: '#f8f9ff', borderRadius: 12, padding: '20px 28px', marginBottom: 32, flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center', flex: 1, minWidth: 100 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#2563eb' }}>{industry.count.toLocaleString()}+</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>收录企业</div>
        </div>
        <div style={{ textAlign: 'center', flex: 1, minWidth: 100 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#2563eb' }}>{industry.countries}</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>覆盖国家</div>
        </div>
        <div style={{ textAlign: 'center', flex: 1, minWidth: 100 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#2563eb' }}>{industry.emails.toLocaleString()}+</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>决策人邮箱</div>
        </div>
      </div>

      {/* 搜索框 */}
      <div style={{ marginBottom: 40 }}>
        <form action="/search" method="get" style={{ display: 'flex', gap: 12 }}>
          <input
            name="q"
            type="text"
            defaultValue={`${industry.keywords[0]} supplier`}
            placeholder={`搜索${industry.zh}相关公司...`}
            style={{ flex: 1, padding: '14px 20px', fontSize: 16, border: '2px solid #e5e7eb', borderRadius: 8, outline: 'none' }}
          />
          <button type="submit" style={{ padding: '14px 28px', fontSize: 16, fontWeight: 600, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
            搜索客户
          </button>
        </form>
        <div style={{ marginTop: 12, fontSize: 13, color: '#94a3b8' }}>
          热门搜索：
          {industry.keywords.slice(0, 4).map(k => (
            <Link key={k} href={`/search?q=${encodeURIComponent(k + ' supplier')}`}
              style={{ color: '#2563eb', textDecoration: 'none', marginRight: 12 }}>
              {k}
            </Link>
          ))}
        </div>
      </div>

      {/* 热门采购国家 */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}><Globe size={20} style={{ marginRight: 4 }} />热门采购国家</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {industry.hotCountries.map(c => (
            <span key={c.name} style={{ padding: '8px 16px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 20, fontSize: 14, color: '#475569' }}>
              {c.flag} {c.name} ({c.count.toLocaleString()}家)
            </span>
          ))}
        </div>
      </div>

      {/* 行业痛点 */}
      <div style={{ background: '#fff8f0', borderRadius: 12, padding: 28, marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}><Frown size={20} /> {industry.zh}外贸获客常见问题？</h2>
        {industry.pains.map((pain, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
            <XCircle size={18} style={{ flexShrink: 0, color: '#ef4444', marginTop: 2 }} />
            <span style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>{pain}</span>
          </div>
        ))}
        <p style={{ marginTop: 16, fontSize: 15, color: '#333', fontWeight: 500 }}>
          <CheckCircle size={18} style={{ marginRight: 4, color: '#22c55e' }} /> 跨境蜂帮你直接从 15+ 数据源聚合目标客户，精准找到采购决策人，主动出击。
        </p>
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', borderRadius: 16, padding: '48px 24px', color: '#fff', marginBottom: 40 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>开始找{industry.zh}海外客户</h2>
        <p style={{ fontSize: 15, opacity: 0.9, marginBottom: 24 }}>注册即送 10 次免费搜索，</p>
        <Link href={`/register?industry=${slug}`}
          style={{ display: 'inline-block', padding: '14px 40px', background: '#fff', color: '#2563eb', fontSize: 16, fontWeight: 600, borderRadius: 8, textDecoration: 'none' }}>
          免费注册
        </Link>
      </div>

      {/* 相关品类 */}
      {relatedIndustries.length > 0 && (
        <div style={{ marginBottom: 60 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>相关品类</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {relatedIndustries.map(r => (
              <Link key={r.slug} href={`/industries/${r.slug}`}
                style={{ padding: '8px 18px', background: '#f5f5f5', borderRadius: 20, fontSize: 14, color: '#475569', textDecoration: 'none' }}>
                {r.icon} {r.zh}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 面包屑导航 */}
      <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 24 }}>
        <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>首页</Link>
        {' / '}
        <Link href="/industries" style={{ color: '#94a3b8', textDecoration: 'none' }}>行业品类</Link>
        {' / '}
        <span style={{ color: '#64748b' }}>{industry.zh}</span>
      </div>
    </div>
  );
}
