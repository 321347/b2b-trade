import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getTrackStats } from '@/lib/track';

export async function GET(req) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  const stats = await getTrackStats(user.id);
  return NextResponse.json(stats);
}
