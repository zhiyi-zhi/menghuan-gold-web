/**
 * GET  /api/records?account_id=&from=&to=&limit=
 *      → 查询金币记录
 * POST /api/records
 *      → 新增或覆盖（UPSERT）一条金币记录
 */

import { ok, fail } from '../_middleware.js';

function getDB(context) {
  const db = context.env.DB;
  if (!db) throw new Error('D1 数据库未绑定');
  return db;
}

// ── GET ──────────────────────────────────────
export async function onRequestGet(context) {
  const db = getDB(context);
  const url = new URL(context.request.url);
  const accountId = url.searchParams.get('account_id');
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const limit = Math.min(Number(url.searchParams.get('limit')) || 200, 1000);

  let sql = `SELECT r.id, r.account_id, r.gold, r.date, r.remark,
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
    sql += ` AND r.date >= ?`;
    binds.push(from);
  }
  if (to) {
    sql += ` AND r.date <= ?`;
    binds.push(to);
  }
  sql += ` ORDER BY r.date DESC, r.id DESC LIMIT ?`;
  binds.push(limit);

  const { results } = await db.prepare(sql).bind(...binds).all();
  return ok({ records: results || [] });
}

// ── POST（UPSERT）──────────────────────────
export async function onRequestPost(context) {
  const db = getDB(context);
  const body = await context.request.json().catch(() => ({}));

  // 兼容前端可能传 note 或 remark
  const accountId = Number(body.account_id);
  const gold = Number(body.gold);
  const date = (body.date || '').trim();
  const remark = (body.remark ?? body.note ?? '').toString().trim();

  if (!Number.isInteger(accountId) || accountId <= 0)
    return fail('account_id 必须是正整数');
  if (!Number.isFinite(gold) || gold < 0)
    return fail('金币数量必须是 >= 0 的数字');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
    return fail('日期格式应为 YYYY-MM-DD');

  // 校验账号存在
  const acc = await db
    .prepare('SELECT id FROM accounts WHERE id = ?')
    .bind(accountId)
    .first();
  if (!acc) return fail('账号不存在', 404);

  // ✅ 核心：INSERT OR UPDATE（原子操作，无竞态）
  await db
    .prepare(
      `INSERT INTO records (account_id, gold, date, remark, created_at, updated_at)
       VALUES (?, ?, ?, ?, datetime('now','localtime'), datetime('now','localtime'))
       ON CONFLICT(account_id, date)
       DO UPDATE SET
         gold = excluded.gold,
         remark = excluded.remark,
         updated_at = datetime('now','localtime')`
    )
    .bind(accountId, gold, date, remark)
    .run();

  // 取回刚写入/更新的记录
  const record = await db
    .prepare('SELECT * FROM records WHERE account_id = ? AND date = ?')
    .bind(accountId, date)
    .first();

  return ok({ record, message: '操作成功' }, 200);
}
