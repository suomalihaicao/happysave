// 分享追踪 + 邀请裂变 API
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

export const GET = withErrorHandling(async (request: NextRequest) => {
  const pool = getPool();
  if (!pool) return NextResponse.json({ success: false }, { status: 500 });
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'stats';

  if (action === 'stats') {
    const [shares, referrals, topSharers] = await Promise.all([
      pool.query("SELECT COUNT(*) as total, SUM(clicks) as totalClicks FROM short_links"),
      pool.query("SELECT COUNT(*) as total, COUNT(CASE WHEN status='completed' THEN 1 END) as completed FROM referrals"),
      pool.query("SELECT p.nickname, u.email, p.totalShares, p.inviteCode FROM user_profiles p JOIN users u ON p.userId = u.id ORDER BY p.totalShares DESC LIMIT 10"),
    ]);
    return NextResponse.json({
      success: true,
      data: {
        totalShares: shares.rows[0].total,
        totalShareClicks: shares.rows[0].totalclicks,
        totalReferrals: referrals.rows[0].total,
        completedReferrals: referrals.rows[0].completed,
        topSharers: topSharers.rows,
      }
    });
  }

  if (action === 'referrals') {
    const r = await pool.query('SELECT * FROM referrals ORDER BY createdAt DESC LIMIT 50');
    return NextResponse.json({ success: true, data: r.rows });
  }

  return NextResponse.json({ success: false }, { status: 400 });
});
