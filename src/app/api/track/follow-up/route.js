import { NextResponse } from 'next/server';
import { runFollowUps } from '@/lib/follow-up';

// Vercel Cron 每天 UTC 8:00（北京时间 16:00）自动执行
// 也可手动 POST 触发
export async function GET() {
  const result = await runFollowUps();
  console.log('[FOLLOW_UP]', JSON.stringify(result));
  return NextResponse.json(result);
}
