import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const LIMITS = {
  search:         { window: '60 s',       max: 30 },
  send:           { window: '60 s',       max: 10 },
  register:       { window: '300 s',      max: 3 },
  generateEmail:  { window: '60 s',       max: 20 },
  login:          { window: '60 s',       max: 10 },
  resetPassword:  { window: '300 s',      max: 3 },
  anonSearch:     { window: '86400 s',    max: 10 },
};

// 内存兜底（本地开发或无 Upstash 时）
const memStore = new Map();

function memCheck(action, identifier) {
  const now = Date.now();
  const limit = LIMITS[action];
  if (!limit) return { allowed: true };

  const windowMs = parseInt(limit.window) * 1000;
  const key = `${action}:${identifier}`;
  const entry = memStore.get(key);

  if (!entry || now > entry.resetAt) {
    memStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit.max - 1, reset: now + windowMs };
  }

  entry.count++;
  if (entry.count > limit.max) {
    return { allowed: false, remaining: 0, reset: entry.resetAt };
  }

  return { allowed: true, remaining: limit.max - entry.count, reset: entry.resetAt };
}

// 懒初始化 Upstash，只在服务端且有环境变量时创建
let redis;
let ratelimits;

function getRatelimit(action) {
  if (typeof window !== 'undefined') return null; // 客户端不初始化
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;

  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  if (!ratelimits) ratelimits = {};

  if (!ratelimits[action]) {
    const cfg = LIMITS[action];
    if (!cfg) return null;
    ratelimits[action] = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(cfg.max, cfg.window),
      analytics: false,
      prefix: `rl:${action}`,
    });
  }

  return ratelimits[action];
}

export async function checkRateLimit(action, identifier) {
  const rl = getRatelimit(action);

  if (rl) {
    try {
      const { success, remaining, reset } = await rl.limit(identifier);
      return { allowed: success, remaining, reset };
    } catch {
      // Upstash 挂了用内存兜底
      return memCheck(action, identifier);
    }
  }

  return memCheck(action, identifier);
}
