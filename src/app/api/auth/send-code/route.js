import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import nodemailer from 'nodemailer';
import { checkRateLimit } from '@/lib/rate-limit';

function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  return new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
}

export async function POST(req) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const rl = await checkRateLimit('register', ip);
  if (!rl.allowed) return NextResponse.json({ error: '操作太频繁，请稍后再试' }, { status: 429 });

  const { email, token } = await req.json();
  if (!email) return NextResponse.json({ error: '请输入邮箱' }, { status: 400 });

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email)) return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 });

  // Turnstile 验证
  if (process.env.TURNSTILE_SECRET_KEY) {
    const formData = new URLSearchParams();
    formData.append('secret', process.env.TURNSTILE_SECRET_KEY);
    formData.append('response', token || '');
    formData.append('remoteip', ip);

    const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', body: formData,
    });
    const outcome = await verify.json();
    if (!outcome.success) return NextResponse.json({ error: '安全验证未通过，请刷新重试' }, { status: 400 });
  }

  // 生成 6 位验证码
  const code = String(Math.floor(100000 + Math.random() * 900000));

  // 存入 Redis，5 分钟过期
  const redis = getRedis();
  if (redis) {
    await redis.set(`vc:${email}`, code, { ex: 300 });
  } else {
    // 无 Redis 时用内存兜底
    if (!global._vcStore) global._vcStore = new Map();
    global._vcStore.set(`vc:${email}`, { code, exp: Date.now() + 300000 });
  }

  // 发邮件
  if (!process.env.SMTP_HOST) return NextResponse.json({ error: '邮件服务未配置' }, { status: 500 });

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 465,
    secure: parseInt(process.env.SMTP_PORT) !== 587,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  try {
    await transporter.sendMail({
      from,
      to: email,
      subject: '跨境蜂 - 邮箱验证码',
      html: `<div style="max-width:480px;margin:0 auto;font-family:Arial,sans-serif"><h2 style="color:#2563eb">跨境蜂</h2><p>您的验证码是：</p><div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#0f172a;background:#f1f5f9;padding:20px;text-align:center;border-radius:8px;margin:16px 0">${code}</div><p style="color:#94a3b8;font-size:13px">5 分钟内有效，请勿转发给他人。</p></div>`,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: '验证码发送失败，请稍后再试' }, { status: 500 });
  }
}
