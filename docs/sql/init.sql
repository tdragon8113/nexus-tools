-- Nexus Tools 数据库初始化脚本
-- 执行前请确保 MySQL 已启动

-- 创建数据库
CREATE DATABASE IF NOT EXISTS nexus_user DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS nexus_workspace DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ==================== nexus_user 数据库 ====================
USE nexus_user;

-- 用户表
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

-- ==================== nexus_workspace 数据库 ====================
USE nexus_workspace;

-- 待办事项表
CREATE TABLE IF NOT EXISTS todos (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status TINYINT DEFAULT 0 COMMENT '0-待办 1-进行中 2-已完成 3-已取消',
    priority TINYINT DEFAULT 0 COMMENT '0-低 1-中 2-高',
    due_date DATETIME,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='待办事项表';

-- 生活记录表（web-time 写记录）
CREATE TABLE IF NOT EXISTS activities (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(50) COMMENT 'pomodoro-work/meeting/other 等',
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    duration_minutes INT COMMENT '持续时长(分钟)',
    notes TEXT,
    version INT DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_start_time (user_id, start_time),
    INDEX idx_user_category (user_id, category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='生活记录表';

-- 习惯表
CREATE TABLE IF NOT EXISTS habits (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    target VARCHAR(20) NOT NULL COMMENT 'daily/weekly/custom',
    custom_days VARCHAR(20),
    version INT DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='习惯表';

-- 习惯打卡表
CREATE TABLE IF NOT EXISTS habit_checkins (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    habit_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    checkin_date DATE NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_habit_date (habit_id, checkin_date),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='习惯打卡表';

-- 时间追踪表
CREATE TABLE IF NOT EXISTS time_tracks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    todo_id BIGINT COMMENT '关联的待办事项',
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    duration INT DEFAULT 0 COMMENT '时长(秒)',
    tags VARCHAR(255) COMMENT '标签,分隔',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_start_time (start_time),
    INDEX idx_todo_id (todo_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='时间追踪表';

-- 工具使用记录表
CREATE TABLE IF NOT EXISTS tool_usages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    tool_name VARCHAR(50) NOT NULL,
    input_data TEXT,
    output_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_tool_name (tool_name),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工具使用记录';

-- 同步元数据表
CREATE TABLE IF NOT EXISTS sync_metadata (
    entity_type VARCHAR(50) PRIMARY KEY,
    last_sync_version BIGINT DEFAULT 0,
    last_sync_at DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='同步元数据';

-- 生活卡片（仅存名称；展示属性由前端处理）
CREATE TABLE IF NOT EXISTS life_cards (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    name VARCHAR(32) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='生活卡片分类';

CREATE TABLE IF NOT EXISTS life_card_children (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    life_card_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    name VARCHAR(32) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    INDEX idx_life_card_id (life_card_id),
    INDEX idx_user_id (user_id),
    CONSTRAINT fk_life_card_children_card
        FOREIGN KEY (life_card_id) REFERENCES life_cards(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='生活卡片子项';

-- 初始化同步元数据
INSERT INTO sync_metadata (entity_type, last_sync_version, last_sync_at) VALUES
('todos', 0, NULL),
('time_tracks', 0, NULL),
('activities', 0, NULL),
('life_cards', 0, NULL)
ON DUPLICATE KEY UPDATE entity_type = entity_type;