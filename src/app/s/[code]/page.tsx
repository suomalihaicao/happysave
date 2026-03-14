// Short Link Redirect with Tracking
import { redirect } from 'next/navigation';
import { db } from '@/lib/universal-db';

export default async function ShortLinkPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const link = db.getShortLinkByCode(code);
  if (!link) redirect('/');
  db.incrementClicks(code);
  redirect(link.originalUrl);
}
