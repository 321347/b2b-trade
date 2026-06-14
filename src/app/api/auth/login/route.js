import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rate-limit';

const supabase = getSupabase();

export async function POST(req) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const rl = checkRateLimit('login', ip);
  if (!rl.allowed) return NextResponse.json({ error: '登录太频繁，请稍后再试' }, { status: 429 });

  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: '请输入邮箱和密码' }, { status: 400 });
  if (typeof email !== 'string' || typeof password !== 'string') return NextResponse.json({ error: '输入格式错误' }, { status: 400 });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 });
  const meta = data.user?.user_metadata || {};
  return NextResponse.json({
    ok: true,
    user: { id: data.user.id, email: data.user.email, name: meta.name || email.split('@')[0], plan: meta.plan || 'free' },
    session: data.session,
  });
}
