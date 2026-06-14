import { getSupabase } from '@/lib/supabase';

const supabase = getSupabase();

// 从请求中提取并验证用户身份。返回 user 对象或 null。
export async function getUser(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return { id: user.id, email: user.email, name: user.user_metadata?.name };
  } catch {
    return null;
  }
}

// 要求登录，否则返回 401
export async function requireAuth(req) {
  const user = await getUser(req);
  if (!user) {
    return { user: null, error: new Response(JSON.stringify({ error: '请先登录' }), { status: 401, headers: { 'Content-Type': 'application/json' } }) };
  }
  return { user, error: null };
}
