import { NextResponse } from 'next/server';

export async function POST(req) {
  const { password } = await req.json();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return NextResponse.json({ error: '管理面板未配置' }, { status: 500 });
  if (password === adminPassword) {
    return NextResponse.json({ ok: true, token: Buffer.from(adminPassword).toString('base64') });
  }
  return NextResponse.json({ error: '密码错误' }, { status: 401 });
}
