import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rate-limit';

const supabase = getSupabase();

export async function POST(req) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const rl = checkRateLimit('resetPassword', ip);
  if (!rl.allowed) return NextResponse.json({ error: '请求太频繁，请稍后再试' }, { status: 429 });

  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: '请输入邮箱' }, { status: 400 });

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://b2b.toolbase.fun'}/reset-password`,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
