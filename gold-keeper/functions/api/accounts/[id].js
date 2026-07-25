/**
 * PUT    /api/accounts/:id  → 更新账号
 * DELETE /api/accounts/:id  → 删除账号（级联删除其记录）
 */

import { ok, fail } from '../../_middleware.js';

function getDB(context) {
  const db = context.env.DB;
  if (!db) throw new Error('D1 数据库未绑定');
  return db;
}

async function findAccount(db, id) {
  const row = await db
    .prepare('SELECT * FROM accounts WHERE id = ?')
    .bind(id)
    .first();
  if (!row) throw Object.assign(new Error('账号不存在'), { status: 404 });
  return row;
}

// ──────────────────────────────── PUT 更新 ────────────────────────────────

export async function onRequestPut(context) {
  const db = getDB(context);
  const id = Number(context.params.id);
  if (!Number.isInteger(id) || id <= 0) return fail('无效的账号 ID', 400);

  const body = await context.request.json().catch(() => ({}));
  await findAccount(db, id);

  const fields = [];
  const values = [];
  const map = {
    name: 'name',
    server: 'server',
    role: 'role',
    note: 'note',
  };
  for (const [key, col] of Object.entries(map)) {
    if (body[key] !== undefined) {
      fields.push(`${col} = ?`);
      values.push(String(body[key]).trim());
    }
  }
  if (fields.length === 0) return fail('没有可更新的字段', 400);

  fields.push(`updated_at = datetime('now','localtime')`);
  values.push(id);

  await db
    .prepare(`UPDATE accounts SET ${fields.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  const account = await db
    .prepare('SELECT * FROM accounts WHERE id = ?')
    .bind(id)
    .first();

  return ok({ account });
}

// ──────────────────────────────── DELETE 删除 ─────────────────────────────

export async function onRequestDelete(context) {
  const db = getDB(context);
  const id = Number(context.params.id);
  if (!Number.isInteger(id) || id <= 0) return fail('无效的账号 ID', 400);

  await findAccount(db, id);

  // 开启事务：先删记录，再删账号
  await db.batch([
    db.prepare('DELETE FROM records WHERE account_id = ?').bind(id),
    db.prepare('DELETE FROM accounts WHERE id = ?').bind(id),
  ]);

  return ok({ message: '账号已删除' });
}
