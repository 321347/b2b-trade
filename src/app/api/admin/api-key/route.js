import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

function checkAdmin(req) {
  const auth = req.headers.get('authorization');
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  return auth === `Bearer ${Buffer.from(adminPassword).toString('base64')}`;
}

// POST: 生成或撤销 API 密钥
export async function POST(req) {
  if (!checkAdmin(req)) return NextResponse.json({ error: '未授权' }, { status: 401 });

  const { userId, action } = await req.json();
  if (!userId || !action) return NextResponse.json({ error: '缺少参数' }, { status: 400 });

  const admin = getSupabaseAdmin();
  const { data: { user }, error } = await admin.auth.admin.getUserById(userId);
  if (error || !user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

  if (action === 'generate') {
    const apiKey = 'b2b_' + crypto.randomUUID().replace(/-/g, '');
    await admin.auth.admin.updateUserById(userId, {
      user_metadata: { ...user.user_metadata, api_key: apiKey },
    });
    return NextResponse.json({ ok: true, api_key: apiKey });
  }

  if (action === 'revoke') {
    const meta = { ...user.user_metadata };
    delete meta.api_key;
    await admin.auth.admin.updateUserById(userId, { user_metadata: meta });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: '无效操作' }, { status: 400 });
}
