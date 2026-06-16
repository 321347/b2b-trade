import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';

async function callDeepSeek(messages, temperature = 0.7) {
  const res = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature,
      max_tokens: 800,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepSeek API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

export async function POST(req) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  const rl = await checkRateLimit('generateEmail', user.id);
  if (!rl.allowed) return NextResponse.json({ error: '生成太频繁，请稍后再试' }, { status: 429 });

  const { company, industry, market, contactName, domain, product, tone, length, extras } = await req.json();
  if (!company && !product) return NextResponse.json({ error: '请提供公司名或产品' }, { status: 400 });

  const toneMap = { formal: '正式专业', friendly: '轻松友好', casual: '简洁直接' };
  const lengthMap = { short: '3-4句', medium: '6-8句', long: '10-12句' };
  const toneDesc = toneMap[tone] || '正式专业';
  const lengthDesc = lengthMap[length] || '6-8句';

  const extrasList = [];
  if (extras?.catalog) extrasList.push('- 文末附上请求索取产品目录的句子');
  if (extras?.sample) extrasList.push('- 文末提议寄送免费样品评估');
  if (extras?.companyIntro) extrasList.push('- 第2段插入简短的公司实力介绍（工厂规模、认证、产能）');

  const systemPrompt = `你是一个外贸开发信专家。根据客户信息撰写一封英文开发信。
要求：
- 语气：${toneDesc}
- 长度：${lengthDesc}
- 不要虚构任何产品数据
- 主题行和正文之间用空行分隔
- 以"Subject: "开头作为邮件主题
${extrasList.join('\n')}

签名固定为：
Best regards,
跨境蜂`;

  const userPrompt = [
    `公司：${company || '未知'}`,
    domain ? `网站：${domain}` : '',
    product ? `产品：${product}` : '',
    industry ? `行业：${industry}` : '',
    market ? `市场：${market}` : '',
    contactName ? `联系人：${contactName}` : '',
  ].filter(Boolean).join('\n');

  if (!process.env.DEEPSEEK_API_KEY) {
    return NextResponse.json({ error: 'AI 服务未配置，请设置 DEEPSEEK_API_KEY' }, { status: 500 });
  }

  try {
    const content = await callDeepSeek([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    // 解析主题和正文
    const lines = content.trim().split('\n');
    let subject = 'Business Inquiry';
    let bodyStart = 0;
    if (lines[0]?.startsWith('Subject:')) {
      subject = lines[0].replace('Subject:', '').trim();
      bodyStart = 1;
    }

    const body = lines.slice(bodyStart).join('\n').trim();

    return NextResponse.json({
      subject,
      body,
      generatedBy: 'DeepSeek',
    });
  } catch (e) {
    return NextResponse.json({ error: 'AI 生成失败：' + e.message }, { status: 500 });
  }
}
