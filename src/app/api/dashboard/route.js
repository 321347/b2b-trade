import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import { getUserQuota, getSendLimit } from '@/lib/quota';

const supabase = getSupabase();

export async function GET(req) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const { data: { user: fullUser } } = await supabase.auth.getUser(token);
  const planKey = fullUser?.user_metadata?.plan || 'free';
  const apiKey = fullUser?.user_metadata?.api_key || '';

  const [quota, sendLimit] = await Promise.all([getUserQuota(req), getSendLimit(req)]);

  return NextResponse.json({
    user: { name: user.name, email: user.email, plan: planKey, apiKey },
    quota,
    sendLimit,
  });
}
