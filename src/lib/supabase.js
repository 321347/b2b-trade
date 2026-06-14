import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fyfwtcdasglawebgcwwg.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_bNAQ1qBekYFUA9idpKEDZg_foDA3Rhw';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let client;
let adminClient;

export function getSupabase() {
  if (!client) client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return client;
}

// 仅服务端使用，拥有绕过 RLS 的完整权限
export function getSupabaseAdmin() {
  if (!adminClient) {
    if (!SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY not set');
    adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  }
  return adminClient;
}
