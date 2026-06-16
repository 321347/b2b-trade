import { NextResponse } from 'next/server';
import { listAllUsers, setUserPlan } from '@/lib/plans';

function checkAdmin(req) {
  const auth = req.headers.get('authorization');
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  return auth === `Bearer ${Buffer.from(adminPassword).toString('base64')}`;
}

export async function GET(req) {
  if (!checkAdmin(req)) return NextResponse.json({ error: '未授权' }, { status: 401 });
  const users = await listAllUsers();
  if (users.error) return NextResponse.json({ error: users.error }, { status: 500 });
  return NextResponse.json({ users });
}

export async function POST(req) {
  if (!checkAdmin(req)) return NextResponse.json({ error: '未授权' }, { status: 401 });
  const { userId, plan } = await req.json();
  if (!userId || !plan) return NextResponse.json({ error: '缺少参数' }, { status: 400 });
  const result = await setUserPlan(userId, plan);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
