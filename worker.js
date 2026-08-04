// AIHCN · 智衡 — Cloudflare Worker API
// 提供联系表单（/api/contact）与邮件订阅（/api/newsletter），数据存 D1
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    if (path === '/api/contact' && method === 'POST') {
      return handleContact(request, env);
    }
    if (path === '/api/newsletter' && method === 'POST') {
      return handleNewsletter(request, env);
    }

    // 其余请求交给静态资源（build/ 目录），未命中页面由 not_found_handling 兜底
    return handleAssets(request, env);
  },
};

// 静态资源响应：统一附加安全头与缓存头（替代 _headers 文件，兼容有 Worker 脚本的部署）
async function handleAssets(request, env) {
  const response = await env.ASSETS.fetch(request);
  const headers = new Headers(response.headers);
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // 静态资源（图片/样式/脚本）长缓存，页面短缓存
  const path = new URL(request.url).pathname;
  headers.set('Cache-Control', path.startsWith('/assets/') ? 'public, max-age=604800' : 'public, max-age=3600');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8',
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders() });
}

function isEmail(v) {
  return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 200;
}

// 联系表单
async function handleContact(request, env) {
  try {
    const body = await request.json();
    // 蜜罐：真用户不会填这个字段
    if (body.company_website) return json({ ok: true });
    // D1 数据库未绑定时的兜底提示（正常部署后不会走到这里）
    if (!env.DB) {
      return json({ ok: false, error: '服务正在配置中，请直接发邮件至 hello@aihcn.com' }, 503);
    }

    const name = String(body.name || '').trim().slice(0, 100);
    const email = String(body.email || '').trim();
    const type = String(body.type || 'other').slice(0, 40);
    const message = String(body.message || '').trim().slice(0, 5000);

    if (!isEmail(email)) return json({ ok: false, error: '邮箱格式不正确。' }, 400);
    if (!message) return json({ ok: false, error: '请简单描述你的需求。' }, 400);

    await env.DB.prepare(
      'INSERT INTO leads (name, email, type, message, created_at) VALUES (?, ?, ?, ?, ?)'
    )
      .bind(name, email, type, message, new Date().toISOString())
      .run();

    return json({ ok: true, message: '已收到，我们会尽快回复你。' });
  } catch (error) {
    return json({ ok: false, error: '提交失败，请稍后再试。' }, 500);
  }
}

// 邮件订阅
async function handleNewsletter(request, env) {
  try {
    const body = await request.json();
    if (body.company_website) return json({ ok: true });

    const email = String(body.email || '').trim();
    if (!isEmail(email)) return json({ ok: false, error: '邮箱格式不正确。' }, 400);
    // D1 数据库未绑定时的兜底提示
    if (!env.DB) {
      return json({ ok: false, error: '服务正在配置中，请稍后再试或发邮件至 hello@aihcn.com' }, 503);
    }

    await env.DB.prepare(
      'INSERT OR IGNORE INTO subscribers (email, created_at) VALUES (?, ?)'
    )
      .bind(email, new Date().toISOString())
      .run();

    return json({ ok: true, message: '订阅成功，欢迎加入智衡。' });
  } catch (error) {
    return json({ ok: false, error: '订阅失败，请稍后再试。' }, 500);
  }
}
