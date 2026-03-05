// Cloudflare D1 点赞功能
// 替换 localStorage 为Cloudflare D1 (KV) 存储

// 点赞新闻 - 使用Cloudflare D1
export async function handleLikeWithD1(newsId, userId = 'anonymous') {
  try {
    // 通过API调用D1
    const API_URL = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1_database/${CLOUDFLARE_D1_ID}/query`;

    // 检查是否已点赞
    const checkResponse = await fetch(`${API_URL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_D1_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: 'SELECT id FROM likes WHERE news_id = ? AND user_id = ?',
        params: [newsId, userId]
      })
    });

    const checkData = await checkResponse.json();
    const existingLike = checkData.result?.[0]?.results?.[0];

    if (existingLike) {
      // 取消点赞
      await fetch(`${API_URL}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_D1_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: 'DELETE FROM likes WHERE news_id = ? AND user_id = ?',
          params: [newsId, userId]
        })
      });

      const count = await getLikeCount(newsId);
      return { action: 'unlike', count };
    } else {
      // 点赞
      await fetch(`${API_URL}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_D1_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: 'INSERT INTO likes (news_id, user_id, created_at) VALUES (?, ?, ?)',
          params: [newsId, userId || 'anonymous', new Date().toISOString()]
        })
      });

      const count = await getLikeCount(newsId);
      return { action: 'like', count };
    }
  } catch (error) {
    console.error('Cloudflare D1 调用失败，降级到localStorage:', error);
    return fallbackToLocalLike(newsId);
  }
}

// 获取点赞数
export async function getLikeCount(newsId) {
  try {
    const API_URL = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1_database/${CLOUDFLARE_D1_ID}/query`;

    const response = await fetch(`${API_URL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_D1_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: 'SELECT COUNT(*) as count FROM likes WHERE news_id = ?',
        params: [newsId]
      })
    });

    const data = await response.json();
    return data.result?.[0]?.results?.[0]?.count || 0;
  } catch (error) {
    console.error('获取点赞数失败，降级到localStorage:', error);
    return parseInt(localStorage.getItem(`likes_${newsId}`) || '0');
  }
}

// 本地localStorage备用方案
function fallbackToLocalLike(newsId) {
  const likes = JSON.parse(localStorage.getItem('ai_news_likes') || '{}');
  if (likes[newsId]) {
    delete likes[newsId];
    localStorage.setItem('ai_news_likes', JSON.stringify(likes));
    return { action: 'unlike', count: 0 };
  } else {
    likes[newsId] = true;
    localStorage.setItem('ai_news_likes', JSON.stringify(likes));
    return { action: 'like', count: 1 };
  }
}

// 初始化点赞按钮
export async function initLikeButton(newsId) {
  const button = document.querySelector('.like-button');
  const countEl = document.getElementById('like-count');

  try {
    // 尝试检查用户是否已点赞
    const API_URL = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1_database/${CLOUDFLARE_D1_ID}/query`;
    const response = await fetch(`${API_URL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_D1_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: 'SELECT id FROM likes WHERE news_id = ? AND user_id = ?',
        params: [newsId, getUserId()]
      })
    });

    const data = await response.json();
    const isLiked = data.result?.[0]?.results?.length > 0;

    if (isLiked) {
      button.classList.add('liked');
      button.textContent = '❤️ 已赞';
    }

    // 获取点赞数
    const count = await getLikeCount(newsId);
    countEl.textContent = count || 0;

  } catch (error) {
    console.error('初始化点赞按钮失败，使用localStorage:', error);
    const likes = JSON.parse(localStorage.getItem('ai_news_likes') || '{}');
    if (likes[newsId]) {
      button.classList.add('liked');
      button.textContent = '❤️ 已赞';
    }
    countEl.textContent = Object.keys(likes).filter(k => k == newsId).length;
  }
}

// 获取用户ID (简单实现)
function getUserId() {
  let userId = localStorage.getItem('user_id');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('user_id', userId);
  }
  return userId;
}

// 导出函数以供HTML文件内联
window.CloudflareLike = {
  handleLikeWithD1,
  getLikeCount,
  initLikeButton,
  getUserId
};
