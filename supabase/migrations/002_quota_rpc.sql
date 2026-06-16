-- 原子配额扣减：解决读-改-写竞态条件
-- 在 Supabase SQL Editor 中运行

CREATE OR REPLACE FUNCTION decrement_quota(user_id uuid, plan_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  quota_field text := 'quota_' || plan_key;
  result int;
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    ARRAY[quota_field],
    to_jsonb(GREATEST(0, COALESCE((raw_user_meta_data->>quota_field)::int, 0) - 1))
  )
  WHERE id = user_id
    AND COALESCE((raw_user_meta_data->>quota_field)::int, 0) > 0
  RETURNING (raw_user_meta_data->>quota_field)::int INTO result;

  IF result IS NULL THEN
    RETURN jsonb_build_object('remaining', 0, 'success', false);
  END IF;

  RETURN jsonb_build_object('remaining', result, 'success', true);
END;
$$;
