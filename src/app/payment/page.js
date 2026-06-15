'use client';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import QRCode from 'qrcode';
import { Check } from 'lucide-react';

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const canvasRef = useRef(null);

  const planKey = searchParams.get('plan') || 'basic';
  const billing = searchParams.get('billing') || 'monthly';
  const planNames = { starter: '入门版', basic: '基础版', pro: '专业版', enterprise: '企业版' };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = '/login'; return; }

    fetch('/api/payment/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ planKey, billing }),
    })
    .then(r => r.json())
    .then(d => {
      if (d.ok) {
        setOrder(d);
        // 生成二维码
        const url = d.codeUrl || d.payUrl;
        if (url) {
          QRCode.toDataURL(url, { width: 240, margin: 2 }).then(setQrDataUrl);
        }
      } else {
        setError(d.error || '创建订单失败');
      }
    })
    .catch(() => setError('网络错误，请重试'))
    .finally(() => setLoading(false));
  }, []);

  // 轮询支付状态
  useEffect(() => {
    if (!order?.orderNo) return;
    const interval = setInterval(() => {
      fetch(`/api/payment/status?orderNo=${order.orderNo}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      .then(r => r.json())
      .then(d => {
        if (d.paid) {
          window.location.href = '/dashboard?paid=1';
        }
      }).catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, [order?.orderNo]);

  if (loading) return <div style={{ padding: 80, textAlign: 'center', color: '#94a3b8' }}>创建订单中...</div>;

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', padding: 20, textAlign: 'center' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>微信支付</h1>
      <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 24 }}>请使用 WeChat Pay 钱包应用扫描下方二维码</p>

      {error && (
        <div style={{ background: '#fef2f2', color: '#dc2626', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>
      )}

      {order && (
        <>
          {/* 订单信息 */}
          <div style={{ background: '#f8fafc', borderRadius: 12, padding: '16px 20px', marginBottom: 24, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>{planNames[planKey] || planKey} · {billing === 'yearly' ? '年付' : '月付'}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>¥{order.amount}</div>
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>订单号: {order.orderNo}</div>
          </div>

          {/* 二维码 */}
          {qrDataUrl ? (
            <div style={{ border: '2px solid #e5e7eb', borderRadius: 16, padding: 20, display: 'inline-block', marginBottom: 24, background: '#fff' }}>
              <img src={qrDataUrl} alt="微信支付二维码" style={{ display: 'block', width: 240, height: 240 }} />
            </div>
          ) : (
            <div style={{ border: '2px solid #e5e7eb', borderRadius: 16, padding: 20, marginBottom: 24, background: '#fafafa', color: '#94a3b8' }}>
              正在生成付款二维码...
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
            <Check size={16} color="#22c55e" />
            <span style={{ fontSize: 14, color: '#475569' }}>扫码后自动开通套餐，无需等待</span>
          </div>
        </>
      )}

      <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.8 }}>
        <p>1. 打开 WeChat Pay 钱包</p>
        <p>2. 扫描上方二维码</p>
        <p>3. 确认金额并完成支付</p>
        <p>4. 支付成功后自动跳转</p>
      </div>
    </div>
  );
}
