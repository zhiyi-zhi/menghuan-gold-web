/**
 * 金币记录 API
 * GET    /api/records?account_id=1&start=2024-01-01&end=2024-12-31  - 查询记录
 * POST   /api/records          - 新增/更新记录（UPSERT）
 * PUT    /api/records/:id      - 修改记录
 * DELETE /api/records/:id      - 删除记录
 */

// GET - 查询记录
export async function onRequestGet(context) {
  const { request, env } = context;
  const db = env.DB;
  const url = new URL(request.url);

  const accountId = url.searchParams.get('account_id');
  const start = url.searchParams.get('start');
  const end = url.searchParams.get('end');

  try {
    let query, bindings = [];

    if (accountId) {
      // 查询指定账号的记录
      let sql = 'SELECT * FROM records WHERE account_id = ?';
      bindings.push(parseInt(accountId));

      if (start) {
        sql += ' AND date >= ?';
        bindings.push(start);
      }
      if (end) {
        sql += ' AND date <= ?';
        bindings.push(end);
      }

      sql += ' ORDER BY date ASC';

      const { results } = await db
        .prepare(sql)
        .bind(...bindings)
        .all();

      return new Response(JSON.stringify({ records: results }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // 查询所有记录（带账号名）
      const { results } = await db
        .prepare(
          `SELECT r.*, a.name as account_name 
           FROM records r 
           JOIN accounts a ON r.account_id = a.id 
           ORDER BY r.date DESC, r.id DESC`
        )
        .all();

      return new Response(JSON.stringify({ records: results }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('GET /api/records error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// POST - 新增或更新记录（UPSERT 核心逻辑）
export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.DB;

  try {
    const body = await request.json();
    const accountId = parseInt(body.account_id);
    const gold = parseInt(body.gold);
    const date = body.date;
    const remark = body.remark || '';

    if (!accountId || isNaN(gold) || !date) {
      return new Response(
        JSON.stringify({ error: 'account_id、gold、date 不能为空' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 验证账号存在
    const account = await db
      .prepare('SELECT id FROM accounts WHERE id = ?')
      .bind(accountId)
      .first();

    if (!account) {
      return new Response(
        JSON.stringify({ error: '账号不存在' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // UPSERT：存在则更新，不存在则插入
    await db
      .prepare(
        `INSERT INTO records (account_id, gold, date, remark, updated_at)
         VALUES (?, ?, ?, ?, datetime('now', 'localtime'))
         ON CONFLICT(account_id, date)
         DO UPDATE SET
           gold = excluded.gold,
           remark = excluded.remark,
           updated_at = datetime('now', 'localtime')`
      )
      .bind(accountId, gold, date, remark)
      .run();

    // 返回刚操作的记录
    const record = await db
      .prepare('SELECT * FROM records WHERE account_id = ? AND date = ?')
      .bind(accountId, date)
      .first();

    return new Response(
      JSON.stringify({ success: true, record, message: '录入成功' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('POST /api/records error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// PUT - 修改记录
export async function onRequestPut(context) {
  const { request, env, params } = context;
  const db = env.DB;
  const id = parseInt(params.id);

  try {
    const body = await request.json();
    const gold = parseInt(body.gold);
    const date = body.date;
    const remark = body.remark || '';

    await db
      .prepare(
        `UPDATE records 
         SET gold = ?, date = ?, remark = ?, updated_at = datetime('now', 'localtime')
         WHERE id = ?`
      )
      .bind(gold, date, remark, id)
      .run();

    const record = await db
      .prepare('SELECT * FROM records WHERE id = ?')
      .bind(id)
      .first();

    return new Response(
      JSON.stringify({ success: true, record }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('PUT /api/records error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// DELETE - 删除记录
export async function onRequestDelete(context) {
  const { env, params } = context;
  const db = env.DB;
  const id = parseInt(params.id);

  try {
    await db
      .prepare('DELETE FROM records WHERE id = ?')
      .bind(id)
      .run();

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('DELETE /api/records error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
