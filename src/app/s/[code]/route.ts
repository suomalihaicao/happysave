// Short link redirect - with tracking
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const link = await db.getShortLinkByCode(code);
  
  if (!link) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Track click
  await db.incrementLinkClick(code);
  await db.logClick({
    shortCode: code,
    storeId: (link as any).storeId || '',
    couponId: (link as any).couponId || '',
    ip: request.headers.get('x-forwarded-for') || '',
    userAgent: request.headers.get('user-agent') || '',
    referer: request.headers.get('referer') || '',
  });

  return NextResponse.redirect((link as any).originalUrl);
}
