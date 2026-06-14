import Link from 'next/link';
import { getAllIndustries } from '@/lib/industries';

export const metadata = {
  title: '外贸行业品类大全 - 20大行业精准获客',
  description: '覆盖厨房小工具、宠物用品、电子配件等20大外贸行业，精准查找海外采购商和进口商联系方式。',
};

export default function IndustriesPage() {
  const industries = getAllIndustries();

  return (
    <div>
      <section style={{ textAlign: 'center', padding: '60px 24px 40px', background: 'linear-gradient(135deg, #eff6ff 0%, #fff 100%)' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>20 大外贸行业，精准找客户</h1>
        <p style={{ fontSize: 16, color: '#64748b', maxWidth: 500, margin: '0 auto' }}>
          选择你的行业，搜索海外采购商和进口商的联系方式
        </p>
      </section>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 20px 80px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {industries.map(ind => (
          <Link key={ind.slug} href={`/industries/${ind.slug}`}
            style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.2s' }}>
            <div style={{ fontSize: 32, width: 56, height: 56, background: '#eff6ff', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {ind.icon}
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: '0 0 4px' }}>{ind.zh}</h3>
              <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>{ind.keywords.slice(0, 3).join('、')}...</p>
            </div>
            <div style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 600, color: '#2563eb', whiteSpace: 'nowrap' }}>
              {ind.count.toLocaleString()}+
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
