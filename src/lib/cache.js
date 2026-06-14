// 内存缓存（Vercel serverless 不支持 fs 写文件）
import { PROVIDERS } from './providers';

const memCache = new Map();

function monthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function getCached(domain) {
  const entry = memCache.get(domain.toLowerCase());
  if (!entry) return null;

  const age = Date.now() - new Date(entry.cachedAt).getTime();
  if (age > 7 * 24 * 60 * 60 * 1000) {
    memCache.delete(domain.toLowerCase());
    return null;
  }
  return entry;
}

export function setCached(domain, data) {
  memCache.set(domain.toLowerCase(), {
    ...data,
    cachedAt: new Date().toISOString(),
  });
}

let quotaState = {};
let currentMonth = monthKey();

export function getQuotaState() {
  const mk = monthKey();
  if (currentMonth !== mk) {
    quotaState = {};
    currentMonth = mk;
  }
  return quotaState;
}

export function incrementQuota(providerName, count = 1) {
  const mk = monthKey();
  if (currentMonth !== mk) {
    quotaState = {};
    currentMonth = mk;
  }
  if (!quotaState[providerName]) {
    quotaState[providerName] = { usedThisMonth: 0, lastUsed: null };
  }
  quotaState[providerName].usedThisMonth += count;
  quotaState[providerName].lastUsed = new Date().toISOString();
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
