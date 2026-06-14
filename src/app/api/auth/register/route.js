import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rate-limit';

const supabase = getSupabase();

const FREE_QUOTA = 10;

export async function POST(req) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const rl = checkRateLimit('register', ip);
  if (!rl.allowed) return NextResponse.json({ error: '注册太频繁，请稍后再试' }, { status: 429 });

  const { email, password, name } = await req.json();
  if (!email || !password) return NextResponse.json({ error: '请输入邮箱和密码' }, { status: 400 });
  if (typeof email !== 'string' || typeof password !== 'string') return NextResponse.json({ error: '输入格式错误' }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: '密码至少 6 位' }, { status: 400 });

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name: name || email.split('@')[0], searchQuota: FREE_QUOTA } }
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const resp = { ok: true, user: data.user };
  if (data.session) {
    resp.session = { access_token: data.session.access_token, expires_at: data.session.expires_at };
    resp.user = { id: data.user.id, email: data.user.email, name: name || email.split('@')[0] };
  }
  return NextResponse.json(resp);
}
