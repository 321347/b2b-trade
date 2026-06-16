import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';

const supabase = getSupabase();

// GET: 获取联系人列表
export async function GET(req) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

  let query = supabase.from('contacts').select('*', { count: 'exact' }).eq('user_id', user.id);
  if (status) query = query.eq('status', status);
  query = query.order('contacted_at', { ascending: false }).range((page - 1) * limit, page * limit - 1);

  const { data, error: dbErr, count } = await query;
  if (dbErr) return NextResponse.json({ error: '查询失败' }, { status: 500 });

  return NextResponse.json({ contacts: data || [], total: count || 0, page, limit });
}

// POST: 新增联系人
export async function POST(req) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  const body = await req.json();
  const { email, name, company, domain, market, status, notes } = body;
  if (!email) return NextResponse.json({ error: '邮箱必填' }, { status: 400 });

  const { data, error: dbErr } = await supabase.from('contacts').insert({
    user_id: user.id,
    email: email.toLowerCase().trim(),
    name: name || '',
    company: company || '',
    domain: domain || '',
    market: market || '',
    status: status || 'contacted',
    notes: notes || '',
    contacted_at: new Date().toISOString(),
  }).select().single();

  if (dbErr) return NextResponse.json({ error: '保存失败' }, { status: 500 });
  return NextResponse.json({ ok: true, contact: data });
}

// PUT: 更新联系人状态/备注
export async function PUT(req) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  const { id, status, notes } = await req.json();
  if (!id) return NextResponse.json({ error: '缺少联系人ID' }, { status: 400 });

  const updates = { updated_at: new Date().toISOString() };
  if (status) updates.status = status;
  if (notes !== undefined) updates.notes = notes;

  const { data, error: dbErr } = await supabase.from('contacts').update(updates).eq('id', id).eq('user_id', user.id).select().single();
  if (dbErr) return NextResponse.json({ error: '更新失败' }, { status: 500 });
  return NextResponse.json({ ok: true, contact: data });
}

// DELETE: 删除联系人
export async function DELETE(req) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: '缺少联系人ID' }, { status: 400 });

  const { error: dbErr } = await supabase.from('contacts').delete().eq('id', id).eq('user_id', user.id);
  if (dbErr) return NextResponse.json({ error: '删除失败' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
