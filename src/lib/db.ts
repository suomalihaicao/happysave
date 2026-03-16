// Database - Runtime auto-select
// PostgreSQL (when DATABASE_URL starts with postgres://) → TiDB (mysql) → SQLite/Memory (dev)

let _db: any = null;

async function loadDb() {
  if (_db) return _db;

  const dbUrl = process.env.DATABASE_URL || '';
  const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://');
  const hasTiDB = !isPostgres && (!!dbUrl || !!process.env.TIDB_URL);

  if (isPostgres) {
    try {
      const { postgres, initPostgres } = await import('./db-postgres');
      await initPostgres();
      _db = postgres;
      console.log('✅ Using PostgreSQL database');
    } catch (err: any) {
      console.error('❌ PostgreSQL connection failed:', err?.message);
      console.log('⚠️  Falling back to SQLite/memory storage');
      const { database } = await import('./sqlite-db');
      _db = database;
    }
  } else if (hasTiDB) {
    try {
      const { tidb, initTiDB } = await import('./db-tidb');
      await initTiDB();
      _db = tidb;
      console.log('✅ Using TiDB database');
    } catch (err: any) {
      console.error('❌ TiDB connection failed:', err?.message);
      console.log('⚠️  Falling back to SQLite/memory storage');
      const { database } = await import('./sqlite-db');
      _db = database;
    }
  } else {
    const { database } = await import('./sqlite-db');
    _db = database;
    console.log('✅ Using SQLite/memory database');
  }

  return _db;
}

// Proxy that lazily loads the correct database
export const db = new Proxy({} as any, {
  get(_, prop) {
    return async (...args: any[]) => {
      const impl = await loadDb();
      const fn = impl[prop];
      if (typeof fn === 'function') {
        return fn.apply(impl, args);
      }
      return fn;
    };
  },
});
