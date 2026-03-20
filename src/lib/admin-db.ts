// Admin DB access helpers
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Database from 'better-sqlite3';

export interface AdminRow {
  id: number;
  username: string;
  passwordHash: string;
  passwordSalt: string;
  role: string;
  lastLogin: string | null;
}

// 这里假设 _mode / _db / memoryAdmins / init 在同文件上方已声明
// 为了保持补丁局部性，不改动其余逻辑
export function getDb() {
  init();
  return {
    async findAdmin(username: string): Promise<AdminRow | null> {
      if (_mode === 'sqlite' && _db) {
        const row = _db
          .prepare('SELECT id, username, passwordHash, passwordSalt, role FROM admins WHERE username = ?')
          .get(username) as AdminRow | undefined;
        return row ?? null;
      }
      return memoryAdmins.find(a => a.username === username) || null;
    },

    async listAdmins(): Promise<Pick<AdminRow, 'id' | 'username' | 'role' | 'lastLogin'>[]> {
      if (_mode === 'sqlite' && _db) {
        return _db
          .prepare('SELECT id, username, role, lastLogin FROM admins ORDER BY createdAt DESC')
          .all() as Pick<AdminRow, 'id' | 'username' | 'role' | 'lastLogin'>[];
      }
      return memoryAdmins.map(a => ({ id: a.id, username: a.username, role: a.role, lastLogin: a.lastLogin }));
    },

    async createAdmin(
      username: string,
      passwordHash: string,
      passwordSalt: string,
      role: string,
    ): Promise<boolean> {
      if (_mode === 'sqlite' && _db) {
        try {
          _db
            .prepare('INSERT INTO admins (username, passwordHash, passwordSalt, role) VALUES (?, ?, ?, ?)')
            .run(username, passwordHash, passwordSalt, role);
          return true;
        } catch (e) {
          const err = e as Error & { message?: string };
          if (err.message?.includes('UNIQUE')) return false; // 用户名已存在
          throw err;
        }
      }
      if (memoryAdmins.find(a => a.username === username)) return false;
      memoryAdmins.push({
        id: String(Date.now()),
        username,
        passwordHash,
        passwordSalt,
        role,
        lastLogin: null,
        createdAt: new Date().toISOString(),
      });
      return true;
    },
  };
}
