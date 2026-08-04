// AIHCN · 智衡 — Pages Function: POST /api/newsletter
// 订阅/等待列表接口，数据存 D1（绑定名 DB）
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json; charset=utf-8',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: cors });
}

function isEmail(v) {
  return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 200;
}

export const onRequestOptions = async () => new Response(null, { status: 204, headers: cors });

export const onRequestPost = async ({ request, env }) => {
  try {
    const body = await request.json();
    if (body.company_website) return json({ ok: true }); // 蜜罐

    const email = String(body.email || '').trim();
    if (!isEmail(email)) return json({ ok: false, error: 'Please provide a valid email address.' }, 400);

    await env.DB.prepare(
      'INSERT OR IGNORE INTO subscribers (email, created_at) VALUES (?, ?)'
    )
      .bind(email, new Date().toISOString())
      .run();

    return json({ ok: true, message: 'Subscribed. Welcome to AIHCN.' });
  } catch (error) {
    return json({ ok: false, error: 'Subscription failed. Please try again later.' }, 500);
  }
};
