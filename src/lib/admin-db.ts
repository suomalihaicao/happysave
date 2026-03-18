// Admin 数据库操作 - 支持 SQLite 和内存模式
import Database from 'better-sqlite3';

let _db: Database | null = null;
let _mode: 'sqlite' | 'memory' = 'memory';

// 内存存储（Vercel fallback）
const memoryAdmins: Array<{
  id: string; username: string; passwordHash: string; passwordSalt: string;
  role: string; lastLogin: string | null; createdAt: string;
}> = [];

function init() {
  if (_db) return;
  try {
    const dynamicRequire = eval('require') as NodeRequire;
    const path = dynamicRequire('path');
    const fs = dynamicRequire('fs');
    const DB_PATH = path.join(process.cwd(), 'data', 'happysave.db');
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _mode = 'sqlite';

    // 创建 admins 表
    _db.exec(`
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        passwordSalt TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        lastLogin TEXT,
        createdAt TEXT DEFAULT (datetime('now'))
      )
    `);
  } catch {
    _mode = 'memory';
    console.log('📦 Admin DB: using in-memory storage');
  }
}

export function getDb() {
  init();
  return {
    async findAdmin(username: string) {
      if (_mode === 'sqlite' && _db) {
        const row = _db.prepare('SELECT id, username, passwordHash, passwordSalt, role FROM admins WHERE username = ?').get(username) as any;
        return row || null;
      }
      return memoryAdmins.find(a => a.username === username) || null;
    },

    async listAdmins() {
      if (_mode === 'sqlite' && _db) {
        return _db.prepare('SELECT id, username, role, lastLogin FROM admins ORDER BY createdAt DESC').all() as any[];
      }
      return memoryAdmins.map(a => ({ id: a.id, username: a.username, role: a.role, lastLogin: a.lastLogin }));
    },

    async createAdmin(username: string, passwordHash: string, passwordSalt: string, role: string): Promise<boolean> {
      if (_mode === 'sqlite' && _db) {
        try {
          _db.prepare('INSERT INTO admins (username, passwordHash, passwordSalt, role) VALUES (?, ?, ?, ?)').run(username, passwordHash, passwordSalt, role);
          return true;
        } catch (e: any) {
          if (e.message?.includes('UNIQUE')) return false; // 用户名已存在
          throw e;
        }
      }
      if (memoryAdmins.find(a => a.username === username)) return false;
      memoryAdmins.push({
        id: String(Date.now()),
        username, passwordHash, passwordSalt, role,
        lastLogin: null,
        createdAt: new Date().toISOString(),
      });
      return true;
    },

    async updateLastLogin(username: string) {
      const now = new Date().toISOString();
      if (_mode === 'sqlite' && _db) {
        _db.prepare('UPDATE admins SET lastLogin = ? WHERE username = ?').run(now, username);
      } else {
        const admin = memoryAdmins.find(a => a.username === username);
        if (admin) admin.lastLogin = now;
      }
    },

    async deleteAdmin(username: string): Promise<boolean> {
      if (_mode === 'sqlite' && _db) {
        const result = _db.prepare('DELETE FROM admins WHERE username = ?').run(username);
        return result.changes > 0;
      }
      const idx = memoryAdmins.findIndex(a => a.username === username);
      if (idx >= 0) { memoryAdmins.splice(idx, 1); return true; }
      return false;
    },

    async changePassword(username: string, passwordHash: string, passwordSalt: string): Promise<boolean> {
      if (_mode === 'sqlite' && _db) {
        const result = _db.prepare('UPDATE admins SET passwordHash = ?, passwordSalt = ? WHERE username = ?').run(passwordHash, passwordSalt, username);
        return result.changes > 0;
      }
      const admin = memoryAdmins.find(a => a.username === username);
      if (admin) { admin.passwordHash = passwordHash; admin.passwordSalt = passwordSalt; return true; }
      return false;
    },
  };
}
