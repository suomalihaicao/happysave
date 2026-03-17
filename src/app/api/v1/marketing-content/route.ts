// 营销内容 API
import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/api-wrapper';
import { Pool } from 'pg';

function getPool() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return new Pool({ connectionString: url });
}

export const GET = withErrorHandling(async () => {
  const pool = getPool();
  if (!pool) return NextResponse.json({ success: true, data: [] });
  const r = await pool.query('SELECT * FROM marketing_content ORDER BY createdAt DESC');
  await pool.end();
  return NextResponse.json({ success: true, data: r.rows });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const { title, platform, content, storeName } = body;
  const id = 'mkt-' + Date.now();
  const pool = getPool();
  if (!pool) return NextResponse.json({ success: false, message: 'No DB' }, { status: 500 });
  await pool.query('INSERT INTO marketing_content (id,title,platform,content,storeName) VALUES ($1,$2,$3,$4,$5)', [id, title, platform, content, storeName || '']);
  await pool.end();
  return NextResponse.json({ success: true, data: { id } }, { status: 201 });
});

export const PUT = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const { id, ...data } = body;
  const pool = getPool();
  if (!pool) return NextResponse.json({ success: false }, { status: 500 });
  await pool.query('UPDATE marketing_content SET title=$1, content=$2, platform=$3, storeName=$4, status=$5 WHERE id=$6',
    [data.title, data.content, data.platform, data.storeName || '', data.status || 'draft', id]);
  await pool.end();
  return NextResponse.json({ success: true });
});

export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const pool = getPool();
  if (!pool) return NextResponse.json({ success: false }, { status: 500 });
  await pool.query('DELETE FROM marketing_content WHERE id=$1', [id]);
  await pool.end();
  return NextResponse.json({ success: true });
});
