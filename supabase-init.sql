-- 在 Supabase SQL Editor 中执行以下语句创建所需的表

-- 1. SMTP 配置表（加密存储）
CREATE TABLE IF NOT EXISTS smtp_configs (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_config TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE smtp_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能访问自己的SMTP配置" ON smtp_configs
  FOR ALL USING (auth.uid() = user_id);

-- 2. 搜索缓存表
CREATE TABLE IF NOT EXISTS search_cache (
  domain TEXT PRIMARY KEY,
  results JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. API 配额表（替代内存计数）
CREATE TABLE IF NOT EXISTS api_quota (
  provider TEXT NOT NULL,
  month_key TEXT NOT NULL,
  used INTEGER DEFAULT 0,
  PRIMARY KEY (provider, month_key)
);

-- 4. 邮件追踪表
CREATE TABLE IF NOT EXISTS email_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient TEXT NOT NULL,
  domain TEXT DEFAULT '',
  subject TEXT DEFAULT '',
  sent_at TIMESTAMPTZ DEFAULT now(),
  opened_at TIMESTAMPTZ,
  opened INTEGER DEFAULT 0,
  follow_up_sent INTEGER DEFAULT 0
);

ALTER TABLE email_tracks ENABLE ROW LEVEL SECURITY;
-- 管理员通过 service_role 读写，用户只能读自己的
CREATE POLICY "用户只能查看自己的追踪数据" ON email_tracks
  FOR SELECT USING (auth.uid() = user_id);
