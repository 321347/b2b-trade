import { getSupabase } from '@/lib/supabase';

const supabase = getSupabase();

const FREE_QUOTA = 25;

// 从 Supabase user metadata 读取配额
export async function getUserQuota(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return { remaining: -1, total: FREE_QUOTA };

    const token = authHeader.slice(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return { remaining: -1, total: FREE_QUOTA };

    const meta = user.user_metadata || {};
    return {
      remaining: typeof meta.searchQuota === 'number' ? meta.searchQuota : FREE_QUOTA,
      total: FREE_QUOTA,
      used: FREE_QUOTA - (typeof meta.searchQuota === 'number' ? Math.max(0, meta.searchQuota) : FREE_QUOTA),
    };
  } catch {
    return { remaining: -1, total: FREE_QUOTA };
  }
}

// 扣减一次搜索配额
export async function decrementQuota(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7);

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;

    const current = typeof user.user_metadata?.searchQuota === 'number' ? user.user_metadata.searchQuota : FREE_QUOTA;
    if (current <= 0) return { remaining: 0, total: FREE_QUOTA };

    const newQuota = current - 1;
    await supabase.auth.updateUser({ data: { searchQuota: newQuota } });

    return { remaining: newQuota, total: FREE_QUOTA, used: FREE_QUOTA - newQuota };
  } catch {
    return null;
  }
}

