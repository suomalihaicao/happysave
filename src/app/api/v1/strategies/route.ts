// 策略库 API — 共享连接池 + 输入验证
import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/api-wrapper';
import { Pool } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool | null {
  if (pool) return pool;
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  pool = new Pool({ connectionString: url, max: 5 });
  return pool;
}

export const GET = withErrorHandling(async () => {
  const p = getPool();
  if (!p) return NextResponse.json({ success: true, data: [] });
  const r = await p.query('SELECT * FROM strategies ORDER BY createdAt DESC');
  return NextResponse.json({ success: true, data: r.rows });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const { title, category, content, priority, targetKpi } = body;
  if (!title || typeof title !== 'string' || !content || typeof content !== 'string') {
    return NextResponse.json({ success: false, message: 'title 和 content 为必填项' }, { status: 400 });
  }
  const p = getPool();
  if (!p) return NextResponse.json({ success: false, message: '数据库未配置' }, { status: 500 });
  const id = 'str-' + Date.now();
  await p.query(
    'INSERT INTO strategies (id,title,category,content,priority,targetKpi) VALUES ($1,$2,$3,$4,$5,$6)',
    [id, title, category || 'growth', content, priority || 'medium', targetKpi || '']
  );
  return NextResponse.json({ success: true, data: { id } }, { status: 201 });
});

export const PUT = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const { id, title, category, content, priority, status, targetKpi } = body;
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ success: false, message: 'id 为必填项' }, { status: 400 });
  }
  const p = getPool();
  if (!p) return NextResponse.json({ success: false, message: '数据库未配置' }, { status: 500 });
  await p.query(
    'UPDATE strategies SET title=$1, category=$2, content=$3, priority=$4, status=$5, targetKpi=$6, updatedAt=NOW() WHERE id=$7',
    [title, category, content, priority, status, targetKpi, id]
  );
  return NextResponse.json({ success: true });
});

export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ success: false, message: 'id 参数缺失' }, { status: 400 });
  }
  const p = getPool();
  if (!p) return NextResponse.json({ success: false, message: '数据库未配置' }, { status: 500 });
  await p.query('DELETE FROM strategies WHERE id=$1', [id]);
  return NextResponse.json({ success: true });
});
