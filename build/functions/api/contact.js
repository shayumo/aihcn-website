// AIHCN · 智衡 — Pages Function: POST /api/contact
// 同域表单接口，数据存 D1（绑定名 DB）
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

    const name = String(body.name || '').trim().slice(0, 100);
    const email = String(body.email || '').trim();
    const type = String(body.type || 'other').slice(0, 40);
    const message = String(body.message || '').trim().slice(0, 5000);

    if (!isEmail(email)) return json({ ok: false, error: 'Please provide a valid email address.' }, 400);
    if (!message) return json({ ok: false, error: 'Please add a short message so we can help.' }, 400);

    await env.DB.prepare(
      'INSERT INTO leads (name, email, type, message, created_at) VALUES (?, ?, ?, ?, ?)'
    )
      .bind(name, email, type, message, new Date().toISOString())
      .run();

    return json({ ok: true, message: 'Received. We will reply soon.' });
  } catch (error) {
    return json({ ok: false, error: 'Submission failed. Please try again later.' }, 500);
  }
};
