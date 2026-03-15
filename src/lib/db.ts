// Database - Works locally (SQLite) and on Vercel (in-memory with seed)
// On Vercel: data seeds on cold start (fast, ~500ms)
// Only click counts reset on cold start (acceptable for MVP)

export { database as db } from './sqlite-db';
