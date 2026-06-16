import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { searchAllProviders } from '@/lib/providers';
import { checkDomainMX } from '@/lib/guesser';
import { getCachedAsync, setCached, getQuotaState, incrementQuota, getQuotaSummary, loadQuotaFromDB } from '@/lib/cache';
import { getUserQuota, decrementQuota } from '@/lib/quota';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  const { domain } = await req.json();
  if (!domain) return NextResponse.json({ error: 'Domain required' }, { status: 400 });

  const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const startTime = Date.now();

  // 从 Supabase 加载持久化配额
  await loadQuotaFromDB();

  // === 1. 缓存命中（内存 + Supabase） ===
  const cached = await getCachedAsync(cleanDomain);
  if (cached) {
    return NextResponse.json({
      ...cached,
      cached: true,
      cacheAge: Math.round((Date.now() - new Date(cached.cachedAt).getTime()) / 1000 / 60 / 60) + 'h',
      elapsed: Date.now() - startTime,
    });
  }

  // === 2. 用户套餐配额检查 ===
  const userQuota = await getUserQuota(req);
  if (userQuota.remaining <= 0) return NextResponse.json({ error: '本月搜索次数已用完，请升级套餐', quota: userQuota }, { status: 429 });

  // === 3. MX 域名验证 ===
  const mxCheck = await checkDomainMX(cleanDomain);
  if (!mxCheck.valid) {
    return NextResponse.json({
      error: 'invalid_domain',
      reason: mxCheck.reason,
      domain: cleanDomain,
      emails: [],
      elapsed: Date.now() - startTime,
    });
  }

  // === 3. 多源 API 查询 ===
  const quotaState = getQuotaState();
  const apiResult = await searchAllProviders(cleanDomain, quotaState);

  // 记录每个 provider 的额度消耗
  for (const [name, result] of Object.entries(apiResult.providers || {})) {
    if (result && !result.error && result.emails?.length > 0) {
      incrementQuota(name, 1);
    }
  }

  // 消耗用户套餐配额
  const qr = await decrementQuota(req);
  const finalQuota = qr || userQuota;

  // 按置信度排序
  const allEmails = (apiResult.emails || []).sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

  // === 5. 组装结果 ===
  const result = {
    domain: cleanDomain,
    mx: mxCheck.mx,
    emails: allEmails,
    total: allEmails.length,
    breakdown: {
      api: (apiResult.emails || []).length,
    },
    providers: Object.fromEntries(
      Object.entries(apiResult.providers || {}).map(([k, v]) => [
        k,
        { found: v?.emails?.length || 0, error: v?.error || null },
      ])
    ),
    quota: getQuotaSummary(),
    cached: false,
    elapsed: Date.now() - startTime,
  };

  // === 6. 写缓存 ===
  if (allEmails.length > 0) {
    setCached(cleanDomain, {
      domain: cleanDomain,
      mx: mxCheck.mx,
      emails: allEmails,
      total: allEmails.length,
      breakdown: result.breakdown,
      providers: result.providers,
      cachedAt: new Date().toISOString(),
    });
  }

  return NextResponse.json(result);
}

// GET - 配额查询
export async function GET() {
  const summary = getQuotaSummary();
  return NextResponse.json({
    quota: summary,
    totalRemaining: summary.reduce((sum, p) => sum + p.remaining, 0),
    totalUsed: summary.reduce((sum, p) => sum + p.used, 0),
    totalQuota: summary.reduce((sum, p) => sum + p.total, 0),
  });
}
