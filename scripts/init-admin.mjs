#!/usr/bin/env node
// 初始化管理员账号
// 用法: node scripts/init-admin.mjs [username] [password]
// 默认: admin / admin123

import { createHmac } from 'crypto';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', 'data', 'happysave.db');
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'happysave-secret-change-me';

const username = process.argv[2] || 'admin';
const password = process.argv[3] || 'admin123';

// 生成密码哈希
const salt = createHmac('sha256', ADMIN_SECRET).update(Date.now().toString()).digest('hex').slice(0, 32);
const hash = createHmac('sha256', salt).update(password).digest('hex');

// 尝试 SQLite
try {
  const Database = (await import('better-sqlite3')).default;
  mkdirSync(dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  db.exec(`
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

  // 检查是否已存在
  const existing = db.prepare('SELECT id FROM admins WHERE username = ?').get(username);
  if (existing) {
    // 更新密码
    db.prepare('UPDATE admins SET passwordHash = ?, passwordSalt = ? WHERE username = ?').run(hash, salt, username);
    console.log(`✅ 管理员 [${username}] 密码已更新`);
  } else {
    db.prepare('INSERT INTO admins (username, passwordHash, passwordSalt, role) VALUES (?, ?, ?, ?)').run(username, hash, salt, 'admin');
    console.log(`✅ 管理员 [${username}] 创建成功`);
  }

  db.close();
  console.log(`   用户名: ${username}`);
  console.log(`   密码: ${password}`);
  console.log(`   ⚠️  请尽快修改默认密码！`);
} catch (e) {
  console.error('❌ 初始化失败:', e.message);
  console.log('提示: 确保 better-sqlite3 已安装: pnpm add better-sqlite3');
}
