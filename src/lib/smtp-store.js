import { getSupabase } from '@/lib/supabase';
import crypto from 'crypto';

const ALGO = 'aes-256-gcm';

function getKey() {
  const raw = process.env.SMTP_ENCRYPTION_KEY;
  if (!raw) throw new Error('SMTP_ENCRYPTION_KEY 环境变量未设置');
  return crypto.createHash('sha256').update(raw).digest();
}

function encrypt(text) {
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return JSON.stringify({
    iv: iv.toString('hex'),
    data: encrypted.toString('hex'),
    tag: tag.toString('hex'),
  });
}

function decrypt(payload) {
  try {
    const { iv, data, tag } = JSON.parse(payload);
    const key = getKey();
    const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(data, 'hex')), decipher.final()]);
    return decrypted.toString('utf8');
  } catch { return null; }
}

export async function saveSmtpConfig(userId, config) {
  try {
    const supabase = getSupabase();
    const encrypted = encrypt(JSON.stringify(config));
    const { error } = await supabase.from('smtp_configs').upsert({
      user_id: userId,
      encrypted_config: encrypted,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    return !error;
  } catch { return false; }
}

export async function getSmtpConfig(userId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('smtp_configs')
    .select('encrypted_config')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data?.encrypted_config) return null;
  const decrypted = decrypt(data.encrypted_config);
  return decrypted ? JSON.parse(decrypted) : null;
}

export async function deleteSmtpConfig(userId) {
  const supabase = getSupabase();
  await supabase.from('smtp_configs').delete().eq('user_id', userId);
}
