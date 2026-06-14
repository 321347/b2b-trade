import { NextResponse } from 'next/server';
import { markOpened } from '@/lib/track';

// 1x1 透明 GIF（最小体积）
const PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

export async function GET(req, { params }) {
  const { id } = await params;
  if (id) await markOpened(id);
  return new NextResponse(PIXEL, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
    },
  });
}
