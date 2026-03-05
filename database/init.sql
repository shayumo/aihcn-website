-- Cloudflare D1 数据库初始化脚本
-- 创建点赞功能需要的表

-- 删除旧表（如果存在）
DROP TABLE IF EXISTS likes;

-- 创建likes表
CREATE TABLE IF NOT EXISTS likes (
    id TEXT PRIMARY KEY,
    news_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_likes_news_id ON likes(news_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON likes(created_at);

-- 创建unique约束，防止重复点赞
CREATE UNIQUE INDEX IF NOT EXISTS idx_likes_unique ON likes(news_id, user_id);

-- 创建统计查询用的视图
CREATE VIEW IF NOT EXISTS like_stats AS
    SELECT
        news_id,
        COUNT(*) as like_count,
        MIN(created_at) as first_like_at,
        MAX(created_at) as last_like_at
    FROM likes
    GROUP BY news_id;

-- 示例数据（可选，用于测试）
-- INSERT INTO likes (id, news_id, user_id, created_at)
-- VALUES ('like_1', 1, 'user_test_1', datetime('now'));
