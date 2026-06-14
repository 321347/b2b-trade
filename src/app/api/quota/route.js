import { NextResponse } from 'next/server';
import { getQuotaSummary, getCacheStats } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  const quota = getQuotaSummary();
  const cache = getCacheStats();

  return NextResponse.json({
    month: new Date().toISOString().slice(0, 7),
    providers: quota,
    totalRemaining: quota.reduce((s, p) => s + p.remaining, 0),
    totalUsed: quota.reduce((s, p) => s + p.used, 0),
    totalQuota: quota.reduce((s, p) => s + p.total, 0),
    cache,
  });
}
