'use client';

export default function Error({ error, reset }) {
  return (
    <div style={{ maxWidth: 500, margin: '80px auto', padding: 40, textAlign: 'center' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>出错了</h1>
      <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>{error?.message || '页面加载失败，请刷新重试'}</p>
      <button onClick={reset}
        style={{ padding: '10px 28px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
        重试
      </button>
    </div>
  );
}
