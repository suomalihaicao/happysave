// REST API - Favorites
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withErrorHandling } from '@/lib/api-wrapper';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'anonymous';
  const favorites = await db.getFavorites(userId);
  return NextResponse.json({ success: true, data: favorites });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const result = await db.toggleFavorite(body.userId || 'anonymous', body.itemType, body.itemId);
  return NextResponse.json({ success: true, ...result });
});