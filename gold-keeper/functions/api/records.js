/**
 * GET  /api/records?account_id=1&from=2026-01-01&to=2026-01-31
 *      → 查询金币记录，可按账号、日期区间过滤
 * POST /api/records
 *      → 新增一条金币记录（含快捷录入逻辑）
 */

import { ok, fail } from '../_middleware.js';

function getDB(context) {
  const db = context.env.DB;
  if (!db) throw new Error('D1 数据库未绑定');
  return db;
}

// ──────────────────────────────── GET 查询 ────────────────────────────────

export async function onRequestGet(context) {
  const db = getDB(context);
  const url = new URL(context.request.url);
  const accountId = url.searchParams.get('account_id');
  const from = url.searchParams.get('from');   // 起始日期
  const to = url.searchParams.get('to');       // 结束日期
  const limit = Math.min(Number(url.searchParams.get('limit')) || 200, 1000);

  let sql = `SELECT r.id, r.account_id, r.gold, r.record_date, r.note,
                    r.created_at, r.updated_at,
                    a.name AS account_name
               FROM records r
               JOIN accounts a ON r.account_id = a.id
              WHERE 1=1`;
  const binds = [];

  if (accountId) {
    sql += ` AND r.account_id = ?`;
    binds.push(Number(accountId));
  }
  if (from) {
    sql += ` AND r.record_date >= ?`;
    binds.push(from);
  }
  if (to) {
    sql += ` AND r.record_date <= ?`;
    binds.push(to);
  }
  sql += ` ORDER BY r.record_date DESC, r.id DESC LIMIT ?`;
  binds.push(limit);

  const { results } = await db.prepare(sql).bind(...binds).all();

  return ok({ records: results || [] });
}

// ──────────────────────────────── POST 新增 ───────────────────────────────

export async function onRequestPost(context) {
  const db = getDB(context);
  const body = await context.request.json().catch(() => ({}));

  const accountId = Number(body.account_id);
  const gold = Number(body.gold);
  const recordDate = (body.record_date || '').trim();
  const note = (body.note || '').trim();

  if (!Number.isInteger(accountId) || accountId <= 0)
    return fail('account_id 必须是正整数');
  if (!Number.isFinite(gold) || gold < 0)
    return fail('金币数量必须是 ≥ 0 的数字');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(recordDate))
    return fail('日期格式应为 YYYY-MM-DD');

  // 校验账号存在
  const acc = await db
    .prepare('SELECT id FROM accounts WHERE id = ?')
    .bind(accountId)
    .first();
  if (!acc) return fail('账号不存在', 404);

  // 同一账号 + 同一天：允许覆盖（更新）或新增？这里选择「更新已有，否则新增」
  const exist = await db
    .prepare('SELECT id FROM records WHERE account_id = ? AND record_date = ?')
    .bind(accountId, recordDate)
    .first();

  if (exist) {
    await db
      .prepare(
        `UPDATE records SET gold = ?, note = ?, updated_at = datetime('now','localtime')
         WHERE id = ?`
      )
      .bind(gold, note, exist.id)
      .run();
    const record = await db
      .prepare('SELECT * FROM records WHERE id = ?')
      .bind(exist.id)
      .first();
    return ok({ record, updated: true }, 200);
  }

  const result = await db
    .prepare(
      `INSERT INTO records (account_id, gold, record_date, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, datetime('now','localtime'), datetime('now','localtime'))`
    )
    .bind(accountId, gold, recordDate, note)
    .run();

  const record = await db
    .prepare('SELECT * FROM records WHERE id = ?')
    .bind(result.meta.last_row_id)
    .first();

  return ok({ record, updated: false }, 201);
}
