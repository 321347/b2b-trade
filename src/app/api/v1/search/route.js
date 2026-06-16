import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { searchAllProviders } from '@/lib/providers';
import { checkDomainMX } from '@/lib/guesser';
import { getCachedAsync, setCached, getQuotaState, incrementQuota, loadQuotaFromDB } from '@/lib/cache';
import { PLANS } from '@/lib/plans';

export const dynamic = 'force-dynamic';

let apiKeyCache = new Map(); // apiKey -> { userId, planKey, expiry }

async function getUserByApiKey(apiKey) {
  const cached = apiKeyCache.get(apiKey);
  if (cached && cached.expiry > Date.now()) return cached;

  const admin = getSupabaseAdmin();

  // O(1) 查询 api_keys 索引表
  const { data: keyRow } = await admin
    .from('api_keys')
    .select('user_id')
    .eq('api_key', apiKey)
    .maybeSingle();

  if (keyRow?.user_id) {
    const { data: { user } } = await admin.auth.admin.getUserById(keyRow.user_id);
    if (user) {
      const planKey = user.user_metadata?.plan || 'free';
      const entry = { userId: user.id, planKey, plan: PLANS[planKey] || PLANS.free, user, expiry: Date.now() + 60000 };
      apiKeyCache.set(apiKey, entry);
      return entry;
    }
  }

  // 无效 key 缓存 10 秒
  apiKeyCache.set(apiKey, { userId: null, planKey: null, plan: null, user: null, expiry: Date.now() + 10000 });
  return null;
}

export async function POST(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: '需要 API Key，请在 Authorization header 中提供 Bearer token' }, { status: 401 });
  }

  const apiKey = authHeader.slice(7);
  const auth = await getUserByApiKey(apiKey);
  if (!auth?.userId) {
    return NextResponse.json({ error: '无效的 API Key' }, { status: 401 });
  }

  const { user, plan } = auth;
  const planKey = user.user_metadata?.plan || 'free';

  // 套餐配额检查
  const quotaField = `quota_${planKey}`;
  const total = plan.searches;
  const current = typeof user.user_metadata?.[quotaField] === 'number' ? user.user_metadata[quotaField] : total;
  if (current <= 0) {
    return NextResponse.json({ error: '本月搜索次数已用完，请升级套餐', quota: { remaining: 0, total, plan: plan.name } }, { status: 429 });
  }

  const { domain } = await req.json();
  if (!domain) return NextResponse.json({ error: 'domain 必填' }, { status: 400 });

  const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const startTime = Date.now();

  await loadQuotaFromDB();

  // 缓存命中
  const cached = await getCachedAsync(cleanDomain);
  if (cached) {
    return NextResponse.json({
      ...cached,
      cached: true,
      elapsed: Date.now() - startTime,
    });
  }

  // MX 验证
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

  // 多源 API 查询
  const quotaState = getQuotaState();
  const apiResult = await searchAllProviders(cleanDomain, quotaState);

  for (const [name, result] of Object.entries(apiResult.providers || {})) {
    if (result && !result.error && result.emails?.length > 0) {
      incrementQuota(name, 1);
    }
  }

  // 原子扣减配额
  const admin = getSupabaseAdmin();
  try {
    await admin.rpc('decrement_quota', { user_id: auth.userId, plan_key: planKey });
  } catch {
    await admin.auth.admin.updateUserById(auth.userId, {
      user_metadata: { ...user.user_metadata, [quotaField]: current - 1 },
    });
  }
  apiKeyCache.delete(apiKey);

  const allEmails = (apiResult.emails || []).sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

  const result = {
    domain: cleanDomain,
    mx: mxCheck.mx,
    emails: allEmails,
    total: allEmails.length,
    breakdown: { api: (apiResult.emails || []).length },
    providers: Object.fromEntries(
      Object.entries(apiResult.providers || {}).map(([k, v]) => [
        k,
        { found: v?.emails?.length || 0, error: v?.error || null },
      ])
    ),
    cached: false,
    elapsed: Date.now() - startTime,
  };

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
