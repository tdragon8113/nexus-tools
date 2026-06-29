-- Nexus Tools / 时光记 数据库初始化脚本
-- 适用：清空数据库后全量重建（DROP DATABASE 后执行本脚本）
-- MySQL 8.0+

CREATE DATABASE IF NOT EXISTS nexus_user DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS nexus_workspace DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ==================== nexus_user ====================
USE nexus_user;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nickname VARCHAR(50),
    avatar VARCHAR(255),
    status TINYINT DEFAULT 1 COMMENT '1-正常 0-禁用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ==================== nexus_workspace（时光记） ====================
USE nexus_workspace;

-- 用户自定义活动类型
CREATE TABLE IF NOT EXISTS activity_categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    slug VARCHAR(64) NOT NULL COMMENT '类型标识，如 work/study',
    label VARCHAR(50) NOT NULL COMMENT '展示名称',
    emoji VARCHAR(16) NOT NULL DEFAULT '✨',
    xp_per_hour INT NOT NULL DEFAULT 15,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_slug (user_id, slug),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='活动类型配置';

-- 生活活动记录
CREATE TABLE IF NOT EXISTS activities (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(64) NOT NULL DEFAULT 'other' COMMENT '对应 activity_categories.slug',
    start_time DATETIME NOT NULL,
    end_time DATETIME NULL COMMENT 'NULL 表示进行中',
    duration_minutes INT NULL COMMENT '持续时长(分钟)',
    mood TINYINT NULL COMMENT '心情 1-5',
    xp INT NOT NULL DEFAULT 0 COMMENT '获得经验',
    notes TEXT NULL COMMENT '富文本备注',
    version INT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_start_time (user_id, start_time),
    INDEX idx_user_category (user_id, category),
    INDEX idx_user_ongoing (user_id, end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='生活活动记录';

-- 日/月/年感悟
CREATE TABLE IF NOT EXISTS reflections (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    scope ENUM('day', 'month', 'year') NOT NULL,
    period_key VARCHAR(10) NOT NULL COMMENT 'day: YYYY-MM-DD, month: YYYY-MM, year: YYYY',
    content TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_scope_period (user_id, scope, period_key),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='感悟总结';
