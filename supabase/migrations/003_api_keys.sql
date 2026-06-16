-- API Key 索引表：O(1) 查询替代 O(n) 用户扫描
-- 在 Supabase SQL Editor 中运行

CREATE TABLE IF NOT EXISTS public.api_keys (
  api_key TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage api_keys" ON public.api_keys
  FOR ALL USING (true);
