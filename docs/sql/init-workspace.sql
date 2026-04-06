-- Nexus Workspace Database Initialization
-- MySQL 9.0+

CREATE DATABASE IF NOT EXISTS nexus_workspace
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE nexus_workspace;

-- 待办事项表
CREATE TABLE IF NOT EXISTS todos (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status TINYINT DEFAULT 0 COMMENT '0: 待办, 1: 进行中, 2: 已完成, 3: 已删除',
    priority TINYINT DEFAULT 1 COMMENT '1: 低, 2: 中, 3: 高',
    due_date DATETIME,
    completed_at DATETIME,
    version INT DEFAULT 1 COMMENT '同步版本号',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_status (user_id, status),
    INDEX idx_user_due_date (user_id, due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 活动记录表
CREATE TABLE IF NOT EXISTS activities (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(50) COMMENT '分类: 工作/学习/娱乐等',
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    duration_minutes INT COMMENT '持续时长(分钟)',
    notes TEXT,
    version INT DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_start_time (user_id, start_time),
    INDEX idx_user_category (user_id, category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 同步版本表
CREATE TABLE IF NOT EXISTS sync_versions (
    user_id BIGINT PRIMARY KEY,
    todo_version INT DEFAULT 0,
    activity_version INT DEFAULT 0,
    last_sync_at DATETIME,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;