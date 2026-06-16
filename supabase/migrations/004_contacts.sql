-- 客户 CRM 轻量版：已联系客户管理
-- 在 Supabase SQL Editor 中运行

CREATE TABLE IF NOT EXISTS public.contacts (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT DEFAULT '',
  company TEXT DEFAULT '',
  domain TEXT DEFAULT '',
  market TEXT DEFAULT '',
  status TEXT DEFAULT 'contacted',
  notes TEXT DEFAULT '',
  contacted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON public.contacts(user_id, status);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户只能管理自己的联系人" ON public.contacts
  FOR ALL USING (auth.uid() = user_id);
