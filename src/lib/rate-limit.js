// 简易内存限流（Vercel serverless 实例级别，冷启动重置）
const store = new Map();

const LIMITS = {
  search: { window: 60_000, max: 30 },
  send: { window: 60_000, max: 10 },
  register: { window: 300_000, max: 3 },
  generateEmail: { window: 60_000, max: 20 },
  login: { window: 60_000, max: 10 },
  resetPassword: { window: 300_000, max: 3 },
  anonSearch: { window: 86_400_000, max: 10 },
};

export function checkRateLimit(action, identifier) {
  // 每次检查时顺手清理 1 个过期条目（分摊清理成本，无需 setInterval）
  const now = Date.now();
  const first = store.keys().next().value;
  if (first && store.get(first)?.resetAt < now) store.delete(first);

  const limit = LIMITS[action];
  if (!limit) return { allowed: true };

  const key = `${action}:${identifier}`;
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + limit.window });
    return { allowed: true, remaining: limit.max - 1, reset: now + limit.window };
  }

  entry.count++;
  if (entry.count > limit.max) {
    return { allowed: false, remaining: 0, reset: entry.resetAt };
  }

  return { allowed: true, remaining: limit.max - entry.count, reset: entry.resetAt };
}
