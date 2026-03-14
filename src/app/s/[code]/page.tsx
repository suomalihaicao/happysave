// Short Link Redirect - /s/[code] (SQLite backed)
import { redirect } from 'next/navigation';
import { sqliteDb } from '@/lib/sqlite-db';
import { headers } from 'next/headers';

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function ShortLinkRedirect({ params }: PageProps) {
  const { code } = await params;
  const link = sqliteDb.shortLinks.findByCode(code);
  
  if (!link) {
    redirect('/');
  }
  
  // Log click and increment
  try {
    const headersList = await headers();
    sqliteDb.shortLinks.incrementClick(code);
    sqliteDb.clickLogs.create({
      shortCode: code,
      storeId: link.storeId,
      couponId: link.couponId,
      ip: headersList.get('x-forwarded-for') || '',
      userAgent: headersList.get('user-agent') || '',
      referer: headersList.get('referer') || '',
      device: 'unknown',
    });
  } catch (e) {
    // Best-effort logging
  }
  
  redirect(link.originalUrl);
}
