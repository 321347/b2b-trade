import { getSupabaseAdmin } from '@/lib/supabase';

function a() { return getSupabaseAdmin(); }

export async function createTrack(userId, recipient, domain, subject) {
  try {
    const { data, error } = await a()
      .from('email_tracks')
      .insert({ user_id: userId, recipient, domain, subject })
      .select('id')
      .single();
    if (error) return null;
    return data.id;
  } catch { return null; }
}

export async function createTracksBatch(userId, targets) {
  try {
    const rows = targets.map(t => ({
      user_id: userId,
      recipient: t.email || t.to,
      domain: t.domain || '',
      subject: t.subject || '',
    }));
    const { data, error } = await a().from('email_tracks').insert(rows).select('id');
    if (error) return [];
    return data.map(d => d.id);
  } catch { return []; }
}

export async function markOpened(trackId) {
  try {
    await a()
      .from('email_tracks')
      .update({ opened_at: new Date().toISOString(), opened: 1 })
      .eq('id', trackId);
  } catch {}
}

export async function getTrackStats(userId) {
  try {
    const { data, error } = await a()
      .from('email_tracks')
      .select('*')
      .eq('user_id', userId)
      .order('sent_at', { ascending: false })
      .limit(50);
    if (error) return { tracks: [], sent: 0, opened: 0 };
    return {
      tracks: data,
      sent: data.length,
      opened: data.filter(d => d.opened).length,
    };
  } catch { return { tracks: [], sent: 0, opened: 0 }; }
}
