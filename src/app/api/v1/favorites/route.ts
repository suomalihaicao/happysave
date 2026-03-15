// REST API - Favorites
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'anonymous';
  const favorites = db.getFavorites(userId);
  return NextResponse.json({ success: true, data: favorites });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = db.toggleFavorite(body.userId || 'anonymous', body.itemType, body.itemId);
  return NextResponse.json({ success: true, ...result });
}
