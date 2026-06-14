import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { requireAuth } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const rl = checkRateLimit('send', ip);
  if (!rl.allowed) return NextResponse.json({ error: '发送太频繁，请稍后再试' }, { status: 429 });
  const { smtp, to } = await req.json();
  if (!smtp?.host || !smtp?.user || !smtp?.pass) {
    return NextResponse.json({ ok: false, error: 'SMTP 配置不完整' }, { status: 400 });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port || 465,
      secure: smtp.port !== 587,
      auth: { user: smtp.user, pass: smtp.pass },
    });

    await transporter.sendMail({
      from: smtp.fromName ? `"${smtp.fromName}" <${smtp.user}>` : smtp.user,
      to: to || smtp.user,
      subject: '鱼获科技 · 邮箱配置测试',
      html: '<p>这是一封测试邮件。如果你收到这封邮件，说明邮箱配置成功。</p><p style="color:#94a3b8">— 鱼获科技</p>',
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message });
  }
}
