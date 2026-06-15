import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { verifyNotify } from '@/lib/lianlian';
import { setUserPlan } from '@/lib/plans';

function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  return new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    // 表单格式或其他
    body = Object.fromEntries(await req.formData());
  }

  if (!body.no_order) return NextResponse.json({ ret_code: '9999', ret_msg: 'Missing order no' });

  const orderNo = body.no_order;
  const payStatus = body.result_pay || body.trade_state;

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
  if (redis) {
    const raw = await redis.get(`order:${orderNo}`);
    if (raw) { order = JSON.parse(raw); await redis.del(`order:${orderNo}`); }
  } else {
    order = global._orders?.get(orderNo);
    if (order) global._orders.delete(orderNo);
  }

  if (!order) {
    // 兜底：直接用回传的 user_id 和金额匹配
  }

  // 按金额匹配套餐
  const { setUserPlan } = await import('@/lib/plans');
  const planKey = order?.planKey || guessPlanByAmount(body.money_order);

  if (order?.userId) {
    await setUserPlan(order.userId, planKey);
  }

  return NextResponse.json({ ret_code: '0000', ret_msg: 'ok' });
}

function guessPlanByAmount(amountStr) {
  const amount = parseInt(amountStr) / 100;
  if (amount >= 399) return 'enterprise';
  if (amount >= 199) return 'pro';
  if (amount >= 99) return 'basic';
  if (amount >= 49) return 'starter';
  return 'free';
}
