/* 
点赞API (前端交互)
使用 localStorage 存储点赞数据
 
这个文件是纯前端实现，不需要后端API。
点赞数据保存在用户浏览器的 localStorage 中。
*/

const STORAGE_KEY = 'ai_news_likes';

// 获取所有点赞数据
function getAllLikes() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
}

// 保存点赞数据
function saveLikes(likes) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(likes));
}

// 获取单篇文章的点赞数
function getLikeCount(newsId) {
    const likes = getAllLikes();
    return likes[newsId] || 0;
}

// 点赞文章
function likeArticle(newsId) {
    const likes = getAllLikes();
    
    if (!likes[newsId]) {
        likes[newsId] = 0;
    }
    
    likes[newsId]++;
    saveLikes(likes);
    
    return {
        success: true,
        count: likes[newsId]
    };
}

// 取消点赞
function unlikeArticle(newsId) {
    const likes = getAllLikes();
    
    if (likes[newsId] && likes[newsId] > 0) {
        likes[newsId]--;
        saveLikes(likes);
        
        return {
            success: true,
            count: likes[newsId]
        };
    }
    
    return {
        success: false,
        count: 0
    };
}

// 导出API（如果需要）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getLikeCount,
        likeArticle,
        unlikeArticle,
        getAllLikes
    };
}
