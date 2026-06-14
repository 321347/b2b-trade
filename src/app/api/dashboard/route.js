import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { getUserQuota } from '@/lib/quota';

export async function GET(req) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const quota = await getUserQuota(req);

  return NextResponse.json({
    user: { name: user.name, email: user.email },
    quota,
  });
}
