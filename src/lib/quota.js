import { getSupabase, getSupabaseAdmin } from '@/lib/supabase';
import { PLANS } from '@/lib/plans';

const supabase = getSupabase();

async function getPlanFromToken(token) {
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return { user: null, plan: PLANS.free };
  const meta = user.user_metadata || {};
  const planKey = meta.plan || 'free';
  return { user, plan: PLANS[planKey] || PLANS.free, planKey };
}

export async function getUserQuota(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return { remaining: -1, total: 10, plan: 'free' };

    const { user, plan, planKey } = await getPlanFromToken(authHeader.slice(7));
    if (!user) return { remaining: -1, total: 10, plan: 'free' };

    const quotaField = `quota_${planKey}`;
    const total = plan.searches;
    const remaining = typeof user.user_metadata?.[quotaField] === 'number'
      ? user.user_metadata[quotaField]
      : total;

    return { remaining, total, used: total - remaining, plan: plan.name };
  } catch {
    return { remaining: -1, total: 10, plan: 'free' };
  }
}

export async function decrementQuota(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7);

    const { user, plan, planKey } = await getPlanFromToken(token);
    if (!user) return null;

    const total = plan.searches;

    // 优先走 DB RPC 原子扣减，消除竞态
    try {
      const admin = getSupabaseAdmin();
      const { data, error } = await admin.rpc('decrement_quota', {
        user_id: user.id,
        plan_key: planKey,
      });
      if (!error && data?.success) {
        return { remaining: data.remaining, total, plan: plan.name, used: total - data.remaining };
      }
      if (!error && data?.success === false) {
        return { remaining: 0, total, plan: plan.name };
      }
    } catch {}

    // RPC 不可用时的 fallback：读-改-写（有竞态风险但不会完全阻塞）
    const meta = user.user_metadata || {};
    const quotaField = `quota_${planKey}`;
    const current = typeof meta[quotaField] === 'number' ? meta[quotaField] : total;
    if (current <= 0) return { remaining: 0, total, plan: plan.name };
    const newQuota = current - 1;
    await supabase.auth.updateUser({ data: { [quotaField]: newQuota } });
    return { remaining: newQuota, total, plan: plan.name, used: total - newQuota };
  } catch {
    return null;
  }
}

// 获取发信限额
export async function getSendLimit(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7);
    const { user, plan, planKey } = await getPlanFromToken(token);
    if (!user) return null;

    const dailyField = `sent_${new Date().toISOString().slice(0, 10)}`;
    const sentToday = user.user_metadata?.[dailyField] || 0;
    return {
      allowed: sentToday < plan.sendsPerDay,
      sentToday,
      maxPerDay: plan.sendsPerDay,
      plan: planKey,
      planName: plan.name,
    };
  } catch { return null; }
}

// 记录发信（count 可选，批量时传入成功数量）
export async function recordSend(req, count = 1) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return;
    const token = authHeader.slice(7);
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return;
    const dailyField = `sent_${new Date().toISOString().slice(0, 10)}`;
    const current = user.user_metadata?.[dailyField] || 0;
    await supabase.auth.updateUser({ data: { [dailyField]: current + count } });
  } catch {}
}
