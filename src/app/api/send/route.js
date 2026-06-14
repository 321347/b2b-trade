import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { requireAuth } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { getSmtpConfig } from '@/lib/smtp-store';
import { getSendLimit, recordSend } from '@/lib/quota';
import { createTrack, createTracksBatch } from '@/lib/track';

function safeName(s) {
  return (s || '').replace(/[\r\n\t\\"]/g, '').replace(/[^\w一-鿿\s·@.(),&+\-]/g, '').slice(0, 100);
}

function makeTransporter(smtp) {
  if (!smtp?.host || !smtp?.user || !smtp?.pass) return null;
  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port || 465,
    secure: smtp.port !== 587,
    auth: { user: smtp.user, pass: smtp.pass },
  });
}

function getBaseUrl(req) {
  const host = req.headers.get('host') || 'b2b.toolbase.fun';
  const proto = host.startsWith('localhost') ? 'http' : 'https';
  return `${proto}://${host}`;
}

export async function POST(req) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  const rl = await checkRateLimit('send', user.id);
  if (!rl.allowed) return NextResponse.json({ error: '发送太频繁，请稍后再试' }, { status: 429 });

  const sendLimit = await getSendLimit(req);
  if (sendLimit && !sendLimit.allowed) return NextResponse.json({ error: `今日发信已达上限（${sendLimit.maxPerDay}封/天），请升级套餐或明天再试` }, { status: 429 });

  const body = await req.json();
  const baseUrl = getBaseUrl(req);

  // 从服务端读取用户 SMTP 配置
  const smtp = await getSmtpConfig(user.id);

  // 用户自有SMTP优先，否则用系统默认
  let defaultFrom;
  const userTransporter = makeTransporter(smtp);
  if (userTransporter) {
    defaultFrom = smtp.fromName ? `"${safeName(smtp.fromName)}" <${smtp.user}>` : smtp.user;
  } else if (process.env.SMTP_HOST) {
    defaultFrom = process.env.SMTP_FROM || process.env.SMTP_USER;
  }

  // 批量发送（每次最多 3 封，防止 Vercel 超时）
  if (body.targets && Array.isArray(body.targets)) {
    const batch = body.targets.slice(0, 3);
    const trackIds = await createTracksBatch(user.id, batch);
    const results = [];
    for (let i = 0; i < batch.length; i++) {
      const t = batch[i];
      const trackId = trackIds[i];
      const recipient = t.email || t.to;
      if (!recipient) { results.push({ email: '', status: 'fail', error: 'Missing recipient' }); continue; }
      try {
        const transporter = userTransporter || (process.env.SMTP_HOST ? nodemailer.createTransport({
          host: process.env.SMTP_HOST, port: parseInt(process.env.SMTP_PORT) || 465,
          secure: parseInt(process.env.SMTP_PORT) !== 587,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        }) : null);
        if (!transporter) { results.push({ email: recipient, status: 'fail', error: 'No SMTP configured' }); continue; }
        const from = defaultFrom || process.env.SMTP_USER;
        const html = buildHtml(t.body || body.body, from, trackId, baseUrl);
        const info = await transporter.sendMail({ from, replyTo: from, to: recipient, subject: t.subject || body.subject || 'Business Inquiry', html });
        results.push({ email: recipient, status: 'ok', messageId: info.messageId });
      } catch (e) {
        results.push({ email: recipient, status: 'fail', error: e.message });
      }
      await new Promise(r => setTimeout(r, 500));
    }
    const ok = results.filter(r => r.status === 'ok').length;
    if (ok > 0) await recordSend(req, ok);
    return NextResponse.json({ ok: true, results, sent: ok, failed: results.length - ok });
  }

  // 单封发送
  const { to, email, subject } = body;
  const recipient = to || email;
  if (!recipient) return NextResponse.json({ ok: false, error: 'Missing recipient' }, { status: 400 });

  let transporter, from;
  if (userTransporter) {
    transporter = userTransporter;
    from = defaultFrom;
  } else if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 465,
      secure: parseInt(process.env.SMTP_PORT) !== 587,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    from = defaultFrom;
  } else {
    return NextResponse.json({ ok: false, error: 'No SMTP configured' }, { status: 500 });
  }

  const trackId = await createTrack(user.id, recipient, body.domain || '', subject || '');
  const html = buildHtml(body.body, from, trackId, baseUrl);

  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const info = await transporter.sendMail({ from, replyTo: from, to: recipient, subject: subject || 'Business Inquiry', html });
      await recordSend(req);
      return NextResponse.json({ ok: true, results: [{ email: recipient, status: 'ok', messageId: info.messageId }], sent: 1, failed: 0 });
    } catch (e) {
      lastError = e;
      if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  return NextResponse.json({ ok: false, error: lastError?.message, results: [{ email: recipient, status: 'fail', error: lastError?.message }], sent: 0, failed: 1 });
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildHtml(bodyText, from, trackId, baseUrl) {
  const body = esc(bodyText || 'We would love to explore a supply partnership.').replace(/\n/g, '<br>');
  const pixel = trackId ? `<img src="${baseUrl}/api/track/open/${trackId}" width="1" height="1" alt="" style="display:none" />` : '';
  return `<p>Dear Sir/Madam,</p><p>${body}</p><br><p>Best regards,<br>${esc(from)}</p><hr style="border:none;border-top:1px solid #eee;margin:20px 0"><p style="font-size:11px;color:#999">This is a one-time business inquiry. If you prefer not to receive further communications, simply reply with "unsubscribe" and we will remove you immediately.</p>${pixel}`;
}
