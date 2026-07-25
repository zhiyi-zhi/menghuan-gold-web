/**
 * 账号管理 API
 * GET    /api/accounts          - 获取所有账号
 * POST   /api/accounts          - 新增账号
 * PUT    /api/accounts/:id      - 修改账号
 * DELETE /api/accounts/:id      - 删除账号
 */

// GET - 获取所有账号
export async function onRequestGet(context) {
  const { env } = context;
  const db = env.DB;

  try {
    const { results } = await db
      .prepare('SELECT * FROM accounts ORDER BY name ASC')
      .all();

    return new Response(JSON.stringify({ accounts: results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('GET /api/accounts error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// POST - 新增账号
export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.DB;

  try {
    const body = await request.json();
    const name = body.name?.trim();
    const server = body.server || '';
    const role = body.role || '';
    const remark = body.remark || '';

    if (!name) {
      return new Response(JSON.stringify({ error: '账号名称不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await db
      .prepare(
        'INSERT INTO accounts (name, server, role, remark) VALUES (?, ?, ?, ?)'
      )
      .bind(name, server, role, remark)
      .run();

    // 获取刚插入的账号
    const account = await db
      .prepare('SELECT * FROM accounts WHERE id = ?')
      .bind(result.meta.last_row_id)
      .first();

    return new Response(JSON.stringify({ success: true, account }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('POST /api/accounts error:', error);
    // 处理 UNIQUE 冲突
    if (error.message.includes('UNIQUE')) {
      return new Response(JSON.stringify({ error: '账号名称已存在' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// PUT - 修改账号
export async function onRequestPut(context) {
  const { request, env, params } = context;
  const db = env.DB;
  const id = parseInt(params.id);

  try {
    const body = await request.json();
    const name = body.name?.trim();
    const server = body.server || '';
    const role = body.role || '';
    const remark = body.remark || '';

    if (!name) {
      return new Response(JSON.stringify({ error: '账号名称不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await db
      .prepare(
        'UPDATE accounts SET name = ?, server = ?, role = ?, remark = ? WHERE id = ?'
      )
      .bind(name, server, role, remark, id)
      .run();

    const account = await db
      .prepare('SELECT * FROM accounts WHERE id = ?')
      .bind(id)
      .first();

    return new Response(JSON.stringify({ success: true, account }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('PUT /api/accounts error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// DELETE - 删除账号
export async function onRequestDelete(context) {
  const { env, params } = context;
  const db = env.DB;
  const id = parseInt(params.id);

  try {
    await db
      .prepare('DELETE FROM accounts WHERE id = ?')
      .bind(id)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('DELETE /api/accounts error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
