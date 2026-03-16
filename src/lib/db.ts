// Database - Runtime auto-select
// TiDB (production, when DATABASE_URL set) → Memory/SQLite (dev)

let _db: any = null;

async function loadDb() {
  if (_db) return _db;

  const hasTiDB = !!(process.env.DATABASE_URL || process.env.TIDB_URL);

  if (hasTiDB) {
    try {
      const { tidb, initTiDB } = await import('./db-tidb');
      await initTiDB();
      _db = tidb;
      console.log('✅ Using TiDB database');
    } catch (err) {
      console.error('❌ TiDB connection failed:', err);
      console.log('⚠️  Falling back to SQLite/memory storage');
      const { database } = await import('./sqlite-db');
      _db = database;
    }
  } else {
    const { database } = await import('./sqlite-db');
    _db = database;
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
