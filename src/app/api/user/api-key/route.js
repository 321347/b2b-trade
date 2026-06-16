import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getSupabase, getSupabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

const supabase = getSupabase();

export async function POST(req) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  const { action } = await req.json();
  const authHeader = req.headers.get('authorization');
  const token = authHeader.slice(7);
  const { data: { user: fullUser }, error: getUserErr } = await supabase.auth.getUser(token);
  if (getUserErr || !fullUser) return NextResponse.json({ error: '用户信息获取失败' }, { status: 500 });

  const admin = getSupabaseAdmin();

  if (action === 'generate') {
    const apiKey = 'b2b_' + crypto.randomUUID().replace(/-/g, '');
    const { error: updateErr } = await supabase.auth.updateUser({
      data: { ...fullUser.user_metadata, api_key: apiKey },
    });
    if (updateErr) return NextResponse.json({ error: '保存 API Key 失败' }, { status: 500 });

    // 同步到 api_keys 索引表
    try {
      // 先删旧 key
      const oldKey = fullUser.user_metadata?.api_key;
      if (oldKey) await admin.from('api_keys').delete().eq('api_key', oldKey);
      await admin.from('api_keys').insert({ api_key: apiKey, user_id: fullUser.id });
    } catch {}

    return NextResponse.json({ ok: true, api_key: apiKey });
  }

  if (action === 'revoke') {
    const oldKey = fullUser.user_metadata?.api_key;
    const meta = { ...fullUser.user_metadata };
    delete meta.api_key;
    const { error: updateErr } = await supabase.auth.updateUser({ data: meta });
    if (updateErr) return NextResponse.json({ error: '撤销 API Key 失败' }, { status: 500 });

    // 从索引表删除
    if (oldKey) {
      try { await admin.from('api_keys').delete().eq('api_key', oldKey); } catch {}
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: '无效操作' }, { status: 400 });
}
