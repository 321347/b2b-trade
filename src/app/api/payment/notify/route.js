import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { verifyNotify } from '@/lib/lianlian';
function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  return new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
}

export async function POST(req) {
  // 先读文本再解析，避免 json() 消费 body 后 formData() 失败
  let body;
  try {
    const text = await req.text();
    try {
      body = JSON.parse(text);
    } catch {
      // 表单格式：key=value&key=value
      body = Object.fromEntries(new URLSearchParams(text));
    }
  } catch {
    return NextResponse.json({ ret_code: '9999', ret_msg: '无法解析请求体' });
  }

  if (!body.no_order) return NextResponse.json({ ret_code: '9999', ret_msg: 'Missing order no' });

  const orderNo = body.no_order;
  const payStatus = String(body.result_pay ?? body.trade_state ?? '');

  // 校验签名
  if (!verifyNotify(body)) {
    return NextResponse.json({ ret_code: '9999', ret_msg: '签名验证失败' });
  }

  // 只要支付成功才处理
  if (payStatus !== 'SUCCESS' && payStatus !== 'TRADE_SUCCESS' && payStatus !== '0') {
    return NextResponse.json({ ret_code: '0000', ret_msg: 'ok' });
  }

  // 查订单
  const redis = getRedis();
  let order;
  try {
    if (redis) {
      const raw = await redis.get(`order:${orderNo}`);
      if (raw) { order = JSON.parse(raw); await redis.del(`order:${orderNo}`); }
    } else {
      order = global._orders?.get(orderNo);
      if (order) global._orders.delete(orderNo);
    }
  } catch {}

  // 按金额匹配套餐
  const { setUserPlan } = await import('@/lib/plans');
  const planKey = order?.planKey || guessPlanByAmount(body.money_order);
  const userId = order?.userId || body.user_id;

  if (userId && planKey && planKey !== 'free') {
    await setUserPlan(userId, planKey);
  }

  return NextResponse.json({ ret_code: '0000', ret_msg: 'ok' });
}

function guessPlanByAmount(amountStr) {
  const amount = parseInt(amountStr) / 100;
  if (isNaN(amount)) return null;
  if (amount >= 399) return 'enterprise';
  if (amount >= 199) return 'pro';
  if (amount >= 99) return 'basic';
  if (amount >= 49) return 'starter';
  return null;
}
