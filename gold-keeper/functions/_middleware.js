/**
 * 全局中间件
 * 1) 给所有响应加 CORS 头（方便本地开发 / 跨域）
 * 2) 统一 JSON 响应格式
 * 3) 兜底错误捕获
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// 预检请求直接放行
export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

// 错误兜底：所有 /api/* 抛出的异常都会走到这里
export async function onRequest({ next }) {
  try {
    const res = await next();
    // 给所有响应补 CORS
    const headers = new Headers(res.headers);
    Object.entries(CORS).forEach(([k, v]) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (err) {
    console.error('[error]', err.message, err.stack);
    return Response.json(
      { success: false, error: err.message || '服务器内部错误' },
      { status: 500, headers: CORS }
    );
  }
}

// 工具：统一成功响应
export function ok(data, status = 200) {
  return Response.json({ success: true, ...data }, { status, headers: CORS });
}

// 工具：统一失败响应
export function fail(message, status = 400, extra = {}) {
  return Response.json({ success: false, error: message, ...extra }, { status, headers: CORS });
}
