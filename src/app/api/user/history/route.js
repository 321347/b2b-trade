import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';

export async function GET(req) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const supabase = getSupabase();
  const { data: { user: u }, error } = await supabase.auth.getUser(req.headers.get('authorization').slice(7));
  if (error || !u) return NextResponse.json({ history: [] });

  const history = u.user_metadata?.searchHistory || [];
  return NextResponse.json({ history });
}

export async function POST(req) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const { history } = await req.json();
  if (!Array.isArray(history)) return NextResponse.json({ error: '格式错误' }, { status: 400 });

  const supabase = getSupabase();
  const { error: updateErr } = await supabase.auth.updateUser({ data: { searchHistory: history.slice(0, 20) } });
  if (updateErr) return NextResponse.json({ error: '保存失败' }, { status: 500 });

  return NextResponse.json({ ok: true });
}
