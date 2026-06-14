import { getSupabaseAdmin } from '@/lib/supabase';
import { getSmtpConfig } from '@/lib/smtp-store';
import nodemailer from 'nodemailer';
import { PLANS } from '@/lib/plans';

function a() { return getSupabaseAdmin(); }

// 为所有 Pro/Enterprise 用户检查未打开邮件，发送跟进
export async function runFollowUps() {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const results = [];

  try {
    // 查所有未打开且未跟进且超过 3 天的记录
    const { data: tracks } = await a()
      .from('email_tracks')
      .select('*')
      .eq('opened', 0)
      .eq('follow_up_sent', 0)
      .lt('sent_at', threeDaysAgo)
      .limit(50);

    if (!tracks?.length) return { processed: 0, sent: 0 };

    // 按 user_id 分组
    const byUser = {};
    for (const t of tracks) {
      if (!byUser[t.user_id]) byUser[t.user_id] = [];
      byUser[t.user_id].push(t);
    }

    for (const [userId, userTracks] of Object.entries(byUser)) {
      // 检查用户是否是 Pro/Enterprise
      const { data: { user } } = await a().auth.admin.getUserById(userId);
      const planKey = user?.user_metadata?.plan || 'free';
      const plan = PLANS[planKey];
      if (!plan?.followUp) continue;

      const smtp = await getSmtpConfig(userId);
      if (!smtp) continue;

      const transporter = nodemailer.createTransport({
        host: smtp.host, port: smtp.port || 465,
        secure: smtp.port !== 587,
        auth: { user: smtp.user, pass: smtp.pass },
      });
      const fromName = (smtp.fromName || '').replace(/[\r\n\t\\"]/g, '').slice(0, 100);
      const from = fromName ? `"${fromName}" <${smtp.user}>` : smtp.user;

      for (const t of userTracks) {
        try {
          const followSubject = `Re: ${t.subject || 'Business Inquiry'}`;
          const html = `<p>Dear Sir/Madam,</p><p>I'm following up on my previous email regarding a potential supply partnership. I wanted to make sure it reached you and see if you might have any interest.</p><p>Looking forward to hearing from you.</p><p>Best regards,<br>${fromName || smtp.user}</p><img src="${process.env.NEXT_PUBLIC_SITE_URL || 'https://b2b.toolbase.fun'}/api/track/open/${t.id}" width="1" height="1" alt="" style="display:none" />`;

          await transporter.sendMail({ from, replyTo: from, to: t.recipient, subject: followSubject, html });
          await a().from('email_tracks').update({ follow_up_sent: 1 }).eq('id', t.id);
          results.push({ recipient: t.recipient, status: 'ok' });
        } catch (err) {
          results.push({ recipient: t.recipient, status: 'fail', error: err.message });
        }
        // 跟进邮件之间也间隔一下
        await new Promise(r => setTimeout(r, 3000 + Math.random() * 3000));
      }
    }

    return { processed: tracks.length, sent: results.filter(r => r.status === 'ok').length, results };
  } catch (err) {
    return { processed: 0, sent: 0, error: err.message };
  }
}
