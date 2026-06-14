import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

const DEFAULT = ['Kitchen', 'Home', 'Pet', 'Toys', 'Stationery', 'Outdoor', 'Beauty', 'Electronics', 'Sports', 'Health', 'Promo', 'General'];

// 内存存储（Vercel serverless 不支持 fs 写文件）
let categoriesStore = null;

function getCategories() {
  return categoriesStore || DEFAULT;
}

export async function GET() {
  try {
    return NextResponse.json(getCategories());
  } catch {
    return NextResponse.json(DEFAULT);
  }
}

export async function POST(req) {
  const { user, error } = await requireAuth(req);
  if (error) return error;
  const { categories } = await req.json();
  categoriesStore = categories;
  return NextResponse.json({ ok: true, categories });
}
