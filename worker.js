// Cloudflare Worker - 点赞功能API后端
// 文件: worker.js

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    // CORS处理
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // API路由
    if (path === '/api/like' && method === 'POST') {
      return handleLike(request, env);
    }

    if (path === '/api/like-count' && method === 'GET') {
      return handleGetLikeCount(request, env);
    }

    if (path === '/api/check-like' && method === 'GET') {
      return handleCheckLike(request, env);
    }

    // 404
    return new Response('Not Found', { status: 404 });
  }
};

// 点赞/取消点赞
async function handleLike(request, env) {
  try {
    const { news_id, user_id } = await request.json();

    // 检查是否已点赞
    const result = await env.DB.prepare(
      'SELECT id FROM likes WHERE news_id = ? AND user_id = ?'
    ).bind(news_id, user_id).first();

    if (result) {
      // 取消点赞
      await env.DB.prepare(
        'DELETE FROM likes WHERE news_id = ? AND user_id = ?'
      ).bind(news_id, user_id).run();

      const count = await getLikeCountFromDB(env.DB, news_id);

      return new Response(JSON.stringify({
        action: 'unlike',
        count: count,
        liked: false
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } else {
      // 点赞
      await env.DB.prepare(
        'INSERT INTO likes (news_id, user_id, created_at) VALUES (?, ?, ?)'
      ).bind(news_id, user_id, new Date().toISOString()).run();

      const count = await getLikeCountFromDB(env.DB, news_id);

      return new Response(JSON.stringify({
        action: 'like',
        count: count,
        liked: true
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// 获取点赞数
async function handleGetLikeCount(request, env) {
  try {
    const url = new URL(request.url);
    const news_id = url.searchParams.get('news_id');

    const result = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM likes WHERE news_id = ?'
    ).bind(news_id).first();

    return new Response(JSON.stringify({
      count: result.count || 0
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// 检查是否已点赞
async function handleCheckLike(request, env) {
  try {
    const url = new URL(request.url);
    const news_id = url.searchParams.get('news_id');
    const user_id = url.searchParams.get('user_id');

    const result = await env.DB.prepare(
      'SELECT id FROM likes WHERE news_id = ? AND user_id = ?'
    ).bind(news_id, user_id).first();

    return new Response(JSON.stringify({
      liked: !!result
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// 从数据库获取点赞数
async function getLikeCountFromDB(db, news_id) {
  const result = await db.prepare(
    'SELECT COUNT(*) as count FROM likes WHERE news_id = ?'
  ).bind(news_id).first();
  return result.count || 0;
}
