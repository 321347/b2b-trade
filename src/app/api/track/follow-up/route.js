import { NextResponse } from 'next/server';
import { runFollowUps } from '@/lib/follow-up';

// Vercel Cron 每天 UTC 8:00（北京时间 16:00）自动执行
export async function GET(req) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }
  const result = await runFollowUps();
  console.log('[FOLLOW_UP]', JSON.stringify(result));
  return NextResponse.json(result);
}
