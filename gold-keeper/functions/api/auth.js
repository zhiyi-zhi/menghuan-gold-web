// functions/api/auth.js
// 简单的密码验证 API
// 密码通过环境变量 ACCESS_PASSWORD 配置（在 Cloudflare Pages 后台设置）

const DEFAULT_PASSWORD = 'gold123'; // 默认密码（建议通过环境变量覆盖）

export async function onRequest(context) {
  const { request } = context;

  // 只接受 POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const password = body.password || '';

    // 优先使用环境变量，否则用默认密码
    const correctPassword = context.env?.ACCESS_PASSWORD || DEFAULT_PASSWORD;

    if (password === correctPassword) {
      // 生成一个简单的 token（时间戳 + 随机字符串的 base64）
      const token = btoa(`${Date.now()}_${Math.random().toString(36).slice(2)}`);
      return new Response(JSON.stringify({ success: true, token }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ error: '密码错误' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: '请求格式错误' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
