import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { requireAuth } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { getSmtpConfig } from '@/lib/smtp-store';

export async function POST(req) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  const rl = checkRateLimit('send', user.id);
  if (!rl.allowed) return NextResponse.json({ error: '发送太频繁，请稍后再试' }, { status: 429 });

  const smtp = await getSmtpConfig(user.id);
  if (!smtp?.host || !smtp?.user || !smtp?.pass) {
    return NextResponse.json({ ok: false, error: '请先保存 SMTP 配置' }, { status: 400 });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port || 465,
      secure: smtp.port !== 587,
      auth: { user: smtp.user, pass: smtp.pass },
    });

    await transporter.sendMail({
      from: smtp.fromName ? `"${(smtp.fromName || '').replace(/[\r\n\t\\"]/g, '').slice(0, 100)}" <${smtp.user}>` : smtp.user,
      to: user.email,
      subject: '跨境蜂 · 邮箱配置测试',
      html: '<p>这是一封测试邮件。如果你收到这封邮件，说明邮箱配置成功。</p><p style="color:#94a3b8">— 跨境蜂</p>',
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message });
  }
}
