// 用户管理 API
import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/api-wrapper';
import { db } from '@/lib/db';

export const GET = withErrorHandling(async () => {
  const users = db.getUsers();
  return NextResponse.json({ success: true, data: users });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const user = db.createUser(body);
  return NextResponse.json({ success: true, data: user }, { status: 201 });
});

export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, message: 'id required' }, { status: 400 });
  db.deleteUser(id);
  return NextResponse.json({ success: true });
});
