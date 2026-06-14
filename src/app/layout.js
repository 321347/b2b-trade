import Nav from './Nav';

export const viewport = { width: 'device-width', initialScale: 1 };

export const icons = {
  icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🐟</text></svg>',
};

export const metadata = {
  title: {
    default: '跨境蜂 - 外贸获客工具 | 智能找海外客户 + 自动发开发信',
    template: '%s | 跨境蜂',
  },
  description: '跨境蜂是一站式B2B外贸获客平台。输入产品名称（如压蒜器、宠物玩具），AI自动匹配海外采购商并生成个性化开发信。邮箱打码，注册查看完整信息。注册即送10次免费搜索。',
  keywords: '外贸获客,外贸找客户,B2B获客工具,外贸开发信,外贸邮箱查找,智能获客,外贸客户搜索,找海外采购商,找国外买家',
  openGraph: {
    title: '跨境蜂 - 外贸获客工具 | 智能找海外客户',
    description: '聚合15+全球数据源，输入域名找采购决策人邮箱，自动发开发信，回复追踪，一站式搞定外贸获客。',
    url: 'https://b2b.toolbase.fun',
    siteName: '跨境蜂',
    type: 'website',
    locale: 'zh_CN',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: '跨境蜂',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: '一站式B2B外贸获客平台，智能找客户、自动发开发信、回复追踪、数据分析',
  url: 'https://b2b.toolbase.fun',
  offers: [
    { '@type': 'Offer', name: '免费版', price: '0', priceCurrency: 'CNY' },
    { '@type': 'Offer', name: '专业版', price: '199', priceCurrency: 'CNY' },
    { '@type': 'Offer', name: '企业版', price: '699', priceCurrency: 'CNY' },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <head>
        <style dangerouslySetInnerHTML={{ __html: '@media(max-width:640px){.hide-mobile{display:none!important}}' }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body style={{ margin: 0, background: '#f8fafc', color: '#1e293b', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif' }}>
        <Nav />
        {children}
        <footer style={{ borderTop: '1px solid #e5e7eb', padding: '32px 24px', textAlign: 'center', fontSize: 13, color: '#94a3b8', background: '#fff', marginTop: 80 }}>
          <div style={{ marginBottom: 12 }}>
            <a href="/" style={{ color: '#94a3b8', textDecoration: 'none', margin: '0 12px' }}>首页</a>
            <a href="/industries" style={{ color: '#94a3b8', textDecoration: 'none', margin: '0 12px' }}>行业品类</a>
            <a href="/pricing" style={{ color: '#94a3b8', textDecoration: 'none', margin: '0 12px' }}>定价</a>
          </div>
          跨境蜂 © 2026 · <a href="/privacy" style={{color:'#94a3b8',textDecoration:'none'}}>隐私政策</a> · <a href="/tos" style={{color:'#94a3b8',textDecoration:'none'}}>服务条款</a>
        </footer>
      </body>
    </html>
  );
}
