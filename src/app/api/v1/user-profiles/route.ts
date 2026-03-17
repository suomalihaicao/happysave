// 用户档案 API
import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/api-wrapper';
import { Pool } from 'pg';

function getPool() { const u = process.env.DATABASE_URL; return u ? new Pool({ connectionString: u }) : null; }

export const GET = withErrorHandling(async (request: NextRequest) => {
  const pool = getPool();
  if (!pool) return NextResponse.json({ success: false }, { status: 500 });
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'list';

  if (action === 'list') {
    const r = await pool.query(`
      SELECT u.id, u.email, u.name, u.role, u.active, u.createdAt, u.lastLogin,
             p.nickname, p.level, p.points, p.totalClicks, p.totalShares, p.inviteCode
      FROM users u LEFT JOIN user_profiles p ON u.id = p.userId
      ORDER BY u.createdAt DESC LIMIT 100
    `);
    await pool.end();
    return NextResponse.json({ success: true, data: r.rows });
  }

  if (action === 'points') {
    const r = await pool.query('SELECT * FROM point_records ORDER BY createdAt DESC LIMIT 50');
    await pool.end();
    return NextResponse.json({ success: true, data: r.rows });
  }

  await pool.end();
  return NextResponse.json({ success: false }, { status: 400 });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const pool = getPool();
  if (!pool) return NextResponse.json({ success: false }, { status: 500 });

  if (body.action === 'add_points') {
    const { userId, points, description } = body;
    const id = 'pt-' + Date.now();
    await pool.query('INSERT INTO point_records (id, userId, action, points, description) VALUES ($1,$2,$3,$4,$5)',
      [id, userId, 'manual', points, description || '']);
    await pool.query('UPDATE user_profiles SET points = points + $1 WHERE userId = $2', [points, userId]);
    await pool.end();
    return NextResponse.json({ success: true });
  }

  await pool.end();
  return NextResponse.json({ success: false }, { status: 400 });
});
