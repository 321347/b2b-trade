import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { requireAuth } from '@/lib/auth';
import { getPlan } from '@/lib/plans';

function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  return new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
}

export async function GET(req) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  // 检查用户是否已升级（plan 不是 free 说明支付回调已处理）
  const plan = getPlan(user);
  if (plan.key !== 'free') {
    return NextResponse.json({ paid: true, plan: plan.key });
  }

  return NextResponse.json({ paid: false });
}
