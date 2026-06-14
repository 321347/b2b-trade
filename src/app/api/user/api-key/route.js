import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import crypto from 'crypto';

const supabase = getSupabase();

// POST: 生成或撤销当前用户的 API 密钥
export async function POST(req) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  const { action } = await req.json();
  const authHeader = req.headers.get('authorization');
  const token = authHeader.slice(7);
  const { data: { user: fullUser } } = await supabase.auth.getUser(token);

  if (action === 'generate') {
    const apiKey = 'b2b_' + crypto.randomUUID().replace(/-/g, '');
    await supabase.auth.updateUser({
      data: { ...fullUser.user_metadata, api_key: apiKey },
    });
    return NextResponse.json({ ok: true, api_key: apiKey });
  }

  if (action === 'revoke') {
    const meta = { ...fullUser.user_metadata };
    delete meta.api_key;
    await supabase.auth.updateUser({ data: meta });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: '无效操作' }, { status: 400 });
}
