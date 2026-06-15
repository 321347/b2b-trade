import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { requireAuth } from '@/lib/auth';
import { PLANS } from '@/lib/plans';
import { buildOrderParams, lianlianRequest, getPaymentUrl, genOrderNo } from '@/lib/lianlian';

function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  return new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
}

export async function POST(req) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  const { planKey, billing, payType } = await req.json();
  const plan = PLANS[planKey];
  if (!plan || plan.price <= 0) return NextResponse.json({ error: '无效套餐' }, { status: 400 });

  const amount = billing === 'yearly' ? Math.round(plan.price * 12 * 0.8) : plan.price;
  const orderNo = genOrderNo();
  const baseUrl = req.headers.get('x-forwarded-host')
    ? `https://${req.headers.get('x-forwarded-host')}`
    : `http://${req.headers.get('host')}`;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://b2b.toolbase.fun';
  const notifyUrl = `${siteUrl}/api/payment/notify`;
  const params = buildOrderParams({
    orderNo,
    amount,
    userId: user.id,
    planKey,
    notifyUrl,
    returnUrl: `${siteUrl}/payment?order=${orderNo}`,
    payType: payType || 'W-NATIVE',
  });

  // 先将订单存入 Redis，回调时取出校验
  const redis = getRedis();
  if (redis) {
    await redis.set(`order:${orderNo}`, JSON.stringify({
      userId: user.id,
      planKey,
      amount,
      created: Date.now(),
    }), { ex: 3600 });
  } else {
    if (!global._orders) global._orders = new Map();
    global._orders.set(orderNo, { userId: user.id, planKey, amount, created: Date.now() });
  }

  try {
    const result = await lianlianRequest(getPaymentUrl(), params);
    if (result.ret_code === '0000') {
      return NextResponse.json({
        ok: true,
        orderNo,
        amount,
        planName: plan.name,
        codeUrl: result.code_url,
        payUrl: result.pay_url || result.code_url,
      });
    }
    return NextResponse.json({ error: result.ret_msg || '创建订单失败', detail: result }, { status: 500 });
  } catch (e) {
    return NextResponse.json({ error: '支付服务异常，请稍后再试' }, { status: 500 });
  }
}
