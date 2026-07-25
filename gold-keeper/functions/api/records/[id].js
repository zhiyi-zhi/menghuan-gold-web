/**
 * PUT    /api/records/:id  → 修改一条金币记录
 * DELETE /api/records/:id  → 删除一条金币记录
 */

import { ok, fail } from '../../_middleware.js';

function getDB(context) {
  const db = context.env.DB;
  if (!db) throw new Error('D1 数据库未绑定');
  return db;
}

async function findRecord(db, id) {
  const row = await db
    .prepare('SELECT * FROM records WHERE id = ?')
    .bind(id)
    .first();
  if (!row) throw Object.assign(new Error('记录不存在'), { status: 404 });
  return row;
}

// ──────────────────────────────── PUT 更新 ────────────────────────────────

export async function onRequestPut(context) {
  const db = getDB(context);
  const id = Number(context.params.id);
  if (!Number.isInteger(id) || id <= 0) return fail('无效的记录 ID', 400);

  const body = await context.request.json().catch(() => ({}));
  await findRecord(db, id);

  const fields = [];
  const values = [];

  if (body.gold !== undefined) {
    const gold = Number(body.gold);
    if (!Number.isFinite(gold) || gold < 0) return fail('金币数量不合法');
    fields.push('gold = ?');
    values.push(gold);
  }
  if (body.record_date !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.record_date))
      return fail('日期格式应为 YYYY-MM-DD');
    fields.push('record_date = ?');
    values.push(body.record_date);
  }
  if (body.note !== undefined) {
    fields.push('note = ?');
    values.push(String(body.note).trim());
  }
  if (fields.length === 0) return fail('没有可更新的字段', 400);

  fields.push(`updated_at = datetime('now','localtime')`);
  values.push(id);

  await db
    .prepare(`UPDATE records SET ${fields.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  const record = await db
    .prepare('SELECT * FROM records WHERE id = ?')
    .bind(id)
    .first();

  return ok({ record });
}

// ──────────────────────────────── DELETE 删除 ─────────────────────────────

export async function onRequestDelete(context) {
  const db = getDB(context);
  const id = Number(context.params.id);
  if (!Number.isInteger(id) || id <= 0) return fail('无效的记录 ID', 400);

  await findRecord(db, id);

  await db
    .prepare('DELETE FROM records WHERE id = ?')
    .bind(id)
    .run();

  return ok({ message: '记录已删除' });
}
