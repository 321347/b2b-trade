import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { getSupabase } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rate-limit';

const supabase = getSupabase();

function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  return new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
}

export async function POST(req) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const rl = await checkRateLimit('register', ip);
  if (!rl.allowed) return NextResponse.json({ error: '注册太频繁，请稍后再试' }, { status: 429 });

  const { email, password, name, code } = await req.json();
  if (!email || !password) return NextResponse.json({ error: '请输入邮箱和密码' }, { status: 400 });
  if (typeof email !== 'string' || typeof password !== 'string') return NextResponse.json({ error: '输入格式错误' }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: '密码至少 6 位' }, { status: 400 });

  // 验证码校验
  const redis = getRedis();
  let stored;
  if (redis) {
    stored = await redis.get(`vc:${email}`);
    if (stored) await redis.del(`vc:${email}`);
  } else {
    const entry = global._vcStore?.get(`vc:${email}`);
    if (entry && Date.now() < entry.exp) stored = entry.code;
    if (global._vcStore) global._vcStore.delete(`vc:${email}`);
  }
  if (!code || String(code) !== String(stored)) {
    return NextResponse.json({ error: '验证码错误或已过期' }, { status: 400 });
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name: name || email.split('@')[0], plan: 'free', quota_free: 10 } }
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const resp = { ok: true, user: { id: data.user.id, email: data.user.email, name: name || email.split('@')[0], plan: 'free' } };
  if (data.session) {
    resp.session = { access_token: data.session.access_token, expires_at: data.session.expires_at };
  }
  return NextResponse.json(resp);
}
