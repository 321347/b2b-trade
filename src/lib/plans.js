import { getSupabaseAdmin } from '@/lib/supabase';

export const PLANS = {
  free:     { name: '免费版', searches: 10,  sendsPerDay: 1,   emailMasked: true,  verify: false, followUp: false, price: 0 },
  starter:  { name: '入门版', searches: 100, sendsPerDay: 10,  emailMasked: true,  verify: false, followUp: false, price: 49 },
  basic:    { name: '基础版', searches: 300, sendsPerDay: 50,  emailMasked: false, verify: true,  followUp: false, price: 99 },
  pro:      { name: '专业版', searches: 800, sendsPerDay: 200, emailMasked: false, verify: true,  followUp: true,  price: 199 },
  enterprise: { name: '企业版', searches: 2000, sendsPerDay: Infinity, emailMasked: false, verify: true, followUp: true, price: 399 },
};

export function getPlan(user) {
  const meta = user?.user_metadata || {};
  const key = meta.plan || 'free';
  return { key, ...(PLANS[key] || PLANS.free) };
}

export async function setUserPlan(userId, planKey) {
  if (!PLANS[planKey]) return { ok: false, error: '无效套餐' };
  try {
    const admin = getSupabaseAdmin();
    await admin.auth.admin.updateUserById(userId, {
      user_metadata: { plan: planKey },
      app_metadata: { plan: planKey },
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function listAllUsers() {
  try {
    const admin = getSupabaseAdmin();
    const { data } = await admin.auth.admin.listUsers({ perPage: 200 });
    return (data?.users || []).map(u => {
      const plan = u.user_metadata?.plan || 'free';
      const quota = u.user_metadata?.searchQuota;
      return {
        id: u.id,
        email: u.email,
        name: u.user_metadata?.name || '',
        plan,
        planName: PLANS[plan]?.name || '免费版',
        searchesLeft: typeof quota === 'number' ? quota : PLANS[plan]?.searches || 10,
        created: u.created_at,
        lastSignIn: u.last_sign_in_at,
      };
    });
  } catch (e) {
    return { error: e.message };
  }
}
