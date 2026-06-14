export default function NotFound() {
  return (
    <div style={{ maxWidth: 500, margin: '80px auto', padding: 40, textAlign: 'center' }}>
      <h1 style={{ fontSize: 64, fontWeight: 800, color: '#e5e7eb', margin: '0 0 8px' }}>404</h1>
      <p style={{ fontSize: 18, color: '#64748b', marginBottom: 24 }}>页面未找到</p>
      <a href="/" style={{ display: 'inline-block', padding: '10px 28px', background: '#0f172a', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
        返回首页
      </a>
    </div>
  );
}
