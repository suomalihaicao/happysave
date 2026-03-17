// 策略库 API
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
  const r = await pool.query('SELECT * FROM strategies ORDER BY createdAt DESC');
  await pool.end();
  return NextResponse.json({ success: true, data: r.rows });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const { title, category, content, priority, targetKpi } = body;
  const id = 'str-' + Date.now();
  const pool = getPool();
  if (!pool) return NextResponse.json({ success: false }, { status: 500 });
  await pool.query(
    'INSERT INTO strategies (id,title,category,content,priority,targetKpi) VALUES ($1,$2,$3,$4,$5,$6)',
    [id, title, category || 'growth', content, priority || 'medium', targetKpi || '']
  );
  await pool.end();
  return NextResponse.json({ success: true, data: { id } }, { status: 201 });
});

export const PUT = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const { id, title, category, content, priority, status, targetKpi } = body;
  const pool = getPool();
  if (!pool) return NextResponse.json({ success: false }, { status: 500 });
  await pool.query(
    'UPDATE strategies SET title=$1, category=$2, content=$3, priority=$4, status=$5, targetKpi=$6, updatedAt=NOW() WHERE id=$7',
    [title, category, content, priority, status, targetKpi, id]
  );
  await pool.end();
  return NextResponse.json({ success: true });
});

export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const pool = getPool();
  if (!pool) return NextResponse.json({ success: false }, { status: 500 });
  await pool.query('DELETE FROM strategies WHERE id=$1', [id]);
  await pool.end();
  return NextResponse.json({ success: true });
});
