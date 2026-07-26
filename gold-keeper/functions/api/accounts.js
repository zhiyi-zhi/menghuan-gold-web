/**
 * GET  /api/accounts  → 列出所有账号（含最新金币、记录数）
 * POST /api/accounts  → 新增账号
 */

import { ok, fail } from '../_middleware.js';

function getDB(context) {
  const db = context.env.DB;
  if (!db) throw new Error('D1 数据库未绑定');
  return db;
}

function validateAccount(body) {
  const name = (body.name || '').trim();
  if (!name) throw Object.assign(new Error('账号名称不能为空'), { status: 400 });
  return {
    name,
    server: (body.server || '').trim(),
    role: (body.role || '').trim(),
    remark: (body.remark || '').trim(),
  };
}

// ── GET ──────────────────────────────────────
export async function onRequestGet(context) {
  const db = getDB(context);

  const { results: accounts } = await db
    .prepare(
      `SELECT a.id, a.name, a.server, a.role, a.remark,
              (SELECT r.gold FROM records r
               WHERE r.account_id = a.id
               ORDER BY r.date DESC, r.id DESC LIMIT 1) AS latest_gold,
              (SELECT r.date FROM records r
               WHERE r.account_id = a.id
               ORDER BY r.date DESC, r.id DESC LIMIT 1) AS latest_date,
              (SELECT COUNT(*) FROM records r WHERE r.account_id = a.id) AS record_count
         FROM accounts a
         ORDER BY a.id DESC`
    )
    .all();

  return ok({ accounts: accounts || [] });
}

// ── POST ─────────────────────────────────────
export async function onRequestPost(context) {
  const db = getDB(context);
  const body = await context.request.json().catch(() => ({}));
  const { name, server, role, remark } = validateAccount(body);

  const exist = await db
    .prepare('SELECT id FROM accounts WHERE name = ?')
    .bind(name)
    .first();
  if (exist) return fail('账号名称已存在', 409);

  const result = await db
    .prepare(
      `INSERT INTO accounts (name, server, role, remark, created_at, updated_at)
       VALUES (?, ?, ?, ?, datetime('now','localtime'), datetime('now','localtime'))`
    )
    .bind(name, server, role, remark)
    .run();

  const account = await db
    .prepare('SELECT * FROM accounts WHERE id = ?')
    .bind(result.meta.last_row_id)
    .first();

  return ok({ account }, 201);
}
