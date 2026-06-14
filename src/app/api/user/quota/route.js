import { NextResponse } from 'next/server';
import { getUserQuota } from '@/lib/quota';

export async function GET(req) {
  const quota = await getUserQuota(req);
  return NextResponse.json(quota);
}
