import { PROVIDERS } from './providers';
import { getSupabase } from '@/lib/supabase';

const memCache = new Map();
let quotaState = {};
let currentMonth = monthKey();

function monthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// ====== 域名缓存（内存 + Supabase） ======

export function getCached(domain) {
  const key = domain.toLowerCase();
  const entry = memCache.get(key);
  if (entry) {
    const age = Date.now() - new Date(entry.cachedAt).getTime();
    if (age > 7 * 24 * 60 * 60 * 1000) { memCache.delete(key); return null; }
    return entry;
  }
  return null;
}

export async function getCachedAsync(domain) {
  const mem = getCached(domain);
  if (mem) return mem;
  try {
    const supabase = getSupabase();
    const { data } = await supabase.from('search_cache').select('results').eq('domain', domain.toLowerCase()).maybeSingle();
    if (data?.results) {
      memCache.set(domain.toLowerCase(), { ...data.results, cachedAt: data.results.cachedAt || new Date().toISOString() });
      return data.results;
    }
  } catch {}
  return null;
}

export function setCached(domain, data) {
  memCache.set(domain.toLowerCase(), { ...data, cachedAt: new Date().toISOString() });
  // 异步写 Supabase，不阻塞
  try {
    const supabase = getSupabase();
    supabase.from('search_cache').upsert({ domain: domain.toLowerCase(), results: data, created_at: new Date().toISOString() }, { onConflict: 'domain' }).catch(() => {});
  } catch {}
}

// ====== API 配额（内存 + Supabase） ======

export function getQuotaState() {
  const mk = monthKey();
  if (currentMonth !== mk) { quotaState = {}; currentMonth = mk; }
  return quotaState;
}

export async function loadQuotaFromDB() {
  try {
    const supabase = getSupabase();
    const mk = monthKey();
    const { data } = await supabase.from('api_quota').select('provider, used').eq('month_key', mk);
    if (data) {
      for (const row of data) {
        if (!quotaState[row.provider]) quotaState[row.provider] = { usedThisMonth: 0, lastUsed: null };
        quotaState[row.provider].usedThisMonth = Math.max(quotaState[row.provider].usedThisMonth, row.used);
      }
    }
  } catch {}
}

export async function incrementQuota(providerName, count = 1) {
  const mk = monthKey();
  if (currentMonth !== mk) { quotaState = {}; currentMonth = mk; }
  if (!quotaState[providerName]) { quotaState[providerName] = { usedThisMonth: 0, lastUsed: null }; }
  quotaState[providerName].usedThisMonth += count;
  quotaState[providerName].lastUsed = new Date().toISOString();

  // 异步写 Supabase
  try {
    const supabase = getSupabase();
    supabase.from('api_quota').upsert({ provider: providerName, month_key: mk, used: quotaState[providerName].usedThisMonth }, { onConflict: 'provider,month_key' }).catch(() => {});
  } catch {}

  return quotaState[providerName];
}

export function getQuotaSummary() {
  const state = getQuotaState();
  return Object.values(PROVIDERS).map((p) => ({
    provider: p.name,
    label: p.label,
    used: state[p.name]?.usedThisMonth || 0,
    total: p.monthlyQuota,
    remaining: p.monthlyQuota - (state[p.name]?.usedThisMonth || 0),
    lastUsed: state[p.name]?.lastUsed || null,
  }));
}

export function getCacheStats() {
  const entries = [...memCache.keys()];
  let oldest = null;
  for (const e of memCache.values()) {
    if (!oldest || e.cachedAt < oldest) oldest = e.cachedAt;
  }
  return { cachedDomains: entries.length, oldestEntry: oldest };
}
