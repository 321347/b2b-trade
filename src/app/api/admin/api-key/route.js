import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

function checkAdmin(req) {
  const auth = req.headers.get('authorization');
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  return auth === `Bearer ${Buffer.from(adminPassword).toString('base64')}`;
}

export async function POST(req) {
  if (!checkAdmin(req)) return NextResponse.json({ error: '未授权' }, { status: 401 });

  const { userId, action } = await req.json();
  if (!userId || !action) return NextResponse.json({ error: '缺少参数' }, { status: 400 });

  const admin = getSupabaseAdmin();
  const { data: { user }, error } = await admin.auth.admin.getUserById(userId);
  if (error || !user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

  if (action === 'generate') {
    const apiKey = 'b2b_' + crypto.randomUUID().replace(/-/g, '');
    const oldKey = user.user_metadata?.api_key;
    const { error: updateErr } = await admin.auth.admin.updateUserById(userId, {
      user_metadata: { ...user.user_metadata, api_key: apiKey },
    });
    if (updateErr) return NextResponse.json({ error: '保存失败' }, { status: 500 });

    // 同步到 api_keys 索引表
    try {
      if (oldKey) await admin.from('api_keys').delete().eq('api_key', oldKey);
      await admin.from('api_keys').insert({ api_key: apiKey, user_id: userId });
    } catch {}

    return NextResponse.json({ ok: true, api_key: apiKey });
  }

  if (action === 'revoke') {
    const oldKey = user.user_metadata?.api_key;
    const meta = { ...user.user_metadata };
    delete meta.api_key;
    const { error: updateErr } = await admin.auth.admin.updateUserById(userId, { user_metadata: meta });
    if (updateErr) return NextResponse.json({ error: '撤销失败' }, { status: 500 });

    if (oldKey) {
      try { await admin.from('api_keys').delete().eq('api_key', oldKey); } catch {}
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: '无效操作' }, { status: 400 });
}
