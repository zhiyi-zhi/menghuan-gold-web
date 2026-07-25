import { H3Error } from 'h3';

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.DB;
  
  try {
    const formData = await request.formData();
    const accountId = parseInt(formData.get('account_id'));
    const gold = parseInt(formData.get('gold'));
    const date = formData.get('date');
    const remark = formData.get('remark') || ''; // 统一用 remark，兼容前端可能传的空值

    if (!accountId || isNaN(gold) || !date) {
      return new Response(JSON.stringify({ error: '参数缺失' }), { status: 400 });
    }

    // ✅ 核心修复：使用 ON CONFLICT 直接实现“插入或覆盖”
    // 这样就不用笨拙地先查后改了，而且绝对不会违反唯一约束
    const result = await db
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

    // 查询刚刚操作的那条记录返回给前端
    // 注意：这里用 RETURNING 语法（如果D1支持）或者直接查，为了兼容性好，我们用直接查
    const record = await db
      .prepare('SELECT * FROM records WHERE account_id = ? AND date = ?')
      .bind(accountId, date)
      .first();

    return new Response(JSON.stringify({ 
      success: true, 
      record, 
      message: result.success ? '操作成功' : '操作失败'
    }), { status: 200 });

  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof H3Error) throw error;
    return new Response(JSON.stringify({ error: '服务器内部错误' }), { status: 500 });
  }
}
