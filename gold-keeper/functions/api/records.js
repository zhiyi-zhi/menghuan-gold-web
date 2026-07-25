import { H3Error } from 'h3';

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.DB;
  
  try {
    const formData = await request.formData();
    const accountId = parseInt(formData.get('account_id'));
    const gold = parseInt(formData.get('gold'));
    const date = formData.get('date');
    const remark = formData.get('remark') || '';

    if (!accountId || isNaN(gold) || !date) {
      return new Response(JSON.stringify({ error: '参数缺失' }), { status: 400 });
    }

    // ✅ 核心：使用 ON CONFLICT 实现“插入或覆盖”，彻底避开 record_date
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

    // 查询刚操作的记录（只用 date，不用 record_date）
    const record = await db
      .prepare('SELECT * FROM records WHERE account_id = ? AND date = ?')
      .bind(accountId, date)
      .first();

    return new Response(JSON.stringify({ 
      success: true, 
      record, 
      message: '操作成功' 
    }), { status: 200 });

  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof H3Error) throw error;
    return new Response(JSON.stringify({ error: '服务器内部错误' }), { status: 500 });
  }
}
