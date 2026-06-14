import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { saveSmtpConfig, getSmtpConfig } from '@/lib/smtp-store';

export async function GET(req) {
  const { user, error } = await requireAuth(req);
  if (error) return error;
  const config = await getSmtpConfig(user.id);
  return NextResponse.json({ config });
}

export async function POST(req) {
  const { user, error } = await requireAuth(req);
  if (error) return error;
  const body = await req.json();
  const ok = await saveSmtpConfig(user.id, {
    host: body.host || '',
    port: body.port || 465,
    user: body.user || '',
    pass: body.pass || '',
    fromName: body.fromName || '',
  });
  return NextResponse.json({ ok });
}
