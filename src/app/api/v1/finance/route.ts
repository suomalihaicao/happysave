// 财务 API
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
  const action = searchParams.get('action') || 'dashboard';

  if (action === 'dashboard') {
    const [total, confirmed, pending, byStore] = await Promise.all([
      pool.query("SELECT COALESCE(SUM(amount),0) as total, COUNT(*) as count FROM finance_transactions"),
      pool.query("SELECT COALESCE(SUM(amount),0) as total FROM finance_transactions WHERE status='confirmed'"),
      pool.query("SELECT COALESCE(SUM(amount),0) as total FROM finance_transactions WHERE status='pending'"),
      pool.query("SELECT storeName, SUM(amount) as total, COUNT(*) as count FROM finance_transactions GROUP BY storeName ORDER BY total DESC LIMIT 10"),
    ]);
    return NextResponse.json({
      success: true,
      data: {
        totalRevenue: total.rows[0].total,
        totalTransactions: total.rows[0].count,
        confirmedRevenue: confirmed.rows[0].total,
        pendingRevenue: pending.rows[0].total,
        byStore: byStore.rows,
      }
    });
  }

  if (action === 'transactions') {
    const r = await pool.query('SELECT * FROM finance_transactions ORDER BY createdAt DESC LIMIT 100');
    return NextResponse.json({ success: true, data: r.rows });
  }

  return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
});
