/**
 * 全局中间件
 * - 请求日志
 * - CORS 头
 * - 错误处理
 */

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // 只处理 API 请求
  if (!path.startsWith('/api/')) {
    return next();
  }

  const start = Date.now();

  try {
    const response = await next();

    // 添加 CORS 头
    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');

    console.log(`[${new Date().toISOString()}] ${request.method} ${path} - ${response.status} (${Date.now() - start}ms)`);

    return new Response(response.body, {
      status: response.status,
      headers
    });
  } catch (error) {
    console.error(`[ERROR] ${request.method} ${path}:`, error.message);

    return new Response(
      JSON.stringify({ error: error.message || '服务器内部错误' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}

// 处理 OPTIONS 预检请求
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}
