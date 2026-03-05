// 点赞功能 - Cloudflare Workers API版本
// 不暴露API Token，通过Workers API与Cloudflare D1通信

// Worker API的URL (需要根据实际部署调整)
const WORKER_API_URL = 'https://aihcn-website.workers.dev/api';

// 点赞/取消点赞
async function handleLikeWithWorker(newsId) {
  const userId = getUserId();
  const button = document.querySelector('.like-button');
  const countEl = document.getElementById('like-count');

  try {
    button.disabled = true;
    button.textContent = '⏳...';

    const response = await fetch(`${WORKER_API_URL}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        news_id: newsId,
        user_id: userId
      })
    });

    if (!response.ok) {
      throw new Error(`Worker API 调用失败: ${response.status}`);
    }

    const data = await response.json();

    // 更新UI
    if (data.liked) {
      button.classList.add('liked');
      button.textContent = '❤️ 已赞';
    } else {
      button.classList.remove('liked');
      button.textContent = '👍 点赞';
    }

    countEl.textContent = data.count || 0;

    // 保存到localStorage作为backup
    backupToLocalStorage(newsId, data.liked);

  } catch (error) {
    console.error('Worker API 调用失败，降级到localStorage:', error);
    return fallbackToLocalLike(newsId, button, countEl);
  } finally {
    button.disabled = false;
  }
}

// 获取点赞数
async function getLikeCountFromWorker(newsId) {
  try {
    const response = await fetch(`${WORKER_API_URL}/like-count?news_id=${newsId}`);

    if (!response.ok) {
      throw new Error(`获取点赞数失败: ${response.status}`);
    }

    const data = await response.json();
    return data.count || 0;
  } catch (error) {
    console.error('获取点赞数失败，使用localStorage:', error);
    return parseInt(localStorage.getItem(`news_like_${newsId}`) || '0');
  }
}

// 检查是否已点赞
async function checkLikeFromWorker(newsId) {
  const userId = getUserId();

  try {
    const response = await fetch(`${WORKER_API_URL}/check-like?news_id=${newsId}&user_id=${userId}`);

    if (!response.ok) {
      throw new Error(`检查点赞状态失败: ${response.status}`);
    }

    const data = await response.json();
    return data.liked;
  } catch (error) {
    console.error('检查点赞状态失败，使用localStorage:', error);
    return localStorage.getItem(`liked_news_${newsId}`) === 'true';
  }
}

// 初始化点赞按钮
async function initLikeButtonWithWorker(newsId) {
  const button = document.querySelector('.like-button');
  const countEl = document.getElementById('like-count');

  if (!button || !countEl) return;

  try {
    // 并行获取点赞数和点赞状态
    const [count, isLiked] = await Promise.all([
      getLikeCountFromWorker(newsId),
      checkLikeFromWorker(newsId)
    ]);

    // 更新UI
    if (isLiked) {
      button.classList.add('liked');
      button.textContent = '❤️ 已赞';
    }

    countEl.textContent = count || 0;

    // 绑定点击事件
    button.onclick = () => handleLikeWithWorker(newsId);

  } catch (error) {
    console.error('初始化点赞按钮失败，降级到localStorage:', error);
    initLikeButtonLocal(newsId, button, countEl);
  }
}

// localStorage备用方案
function fallbackToLocalLike(newsId, button, countEl) {
  const liked = localStorage.getItem(`liked_news_${newsId}`) === 'true';

  if (liked) {
    localStorage.removeItem(`liked_news_${newsId}`);
    const count = Math.max(0, parseInt(localStorage.getItem(`news_like_${newsId}`) || '0') - 1);
    localStorage.setItem(`news_like_${newsId}`, count);

    button.classList.remove('liked');
    button.textContent = '👍 点赞';
    countEl.textContent = count;
  } else {
    localStorage.setItem(`liked_news_${newsId}`, 'true');
    const count = parseInt(localStorage.getItem(`news_like_${newsId}`) || '0') + 1;
    localStorage.setItem(`news_like_${newsId}`, count);

    button.classList.add('liked');
    button.textContent = '❤️ 已赞';
    countEl.textContent = count;
  }
}

// 使用localStorage初始化（备用）
function initLikeButtonLocal(newsId, button, countEl) {
  const liked = localStorage.getItem(`liked_news_${newsId}`) === 'true';
  const count = parseInt(localStorage.getItem(`news_like_${newsId}`) || '0');

  if (liked) {
    button.classList.add('liked');
    button.textContent = '❤️ 已赞';
  }

  countEl.textContent = count || 0;

  button.onclick = () => fallbackToLocalLike(newsId, button, countEl);
}

// 备份到localStorage
function backupToLocalStorage(newsId, liked) {
  if (liked) {
    localStorage.setItem(`liked_news_${newsId}`, 'true');
    const count = parseInt(localStorage.getItem(`news_like_${newsId}`) || '0') + 1;
    localStorage.setItem(`news_like_${newsId}`, count);
  } else {
    localStorage.removeItem(`liked_news_${newsId}`);
    const count = Math.max(0, parseInt(localStorage.getItem(`news_like_${newsId}`) || '0') - 1);
    localStorage.setItem(`news_like_${newsId}`, count);
  }
}

// 获取用户ID (简单生成并持久化)
function getUserId() {
  let userId = localStorage.getItem('aihcn_user_id');
  if (!userId) {
    userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('aihcn_user_id', userId);
  }
  return userId;
}

// 导出到全局 (供HTML页面调用)
window.initLikeButton = initLikeButtonWithWorker;
window.handleLike = handleLikeWithWorker;
window.getUserId = getUserId;

// 页面加载完成后自动初始化
document.addEventListener('DOMContentLoaded', () => {
  const newsId = document.querySelector('.like-button')?.dataset?.newsId;
  if (newsId) {
    initLikeButtonWithWorker(newsId);
  }
});
