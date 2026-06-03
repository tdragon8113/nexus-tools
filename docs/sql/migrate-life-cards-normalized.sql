-- 从 life_card_configs(JSON) 迁移到 life_cards + life_card_children（仅名称）
-- 若已是新表结构则无需执行

USE nexus_workspace;

DROP TABLE IF EXISTS life_card_children;
DROP TABLE IF EXISTS life_cards;
DROP TABLE IF EXISTS life_card_configs;

CREATE TABLE life_cards (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    name VARCHAR(32) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='生活卡片分类';

CREATE TABLE life_card_children (
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

-- 旧 JSON 数据无法可靠解析为行级结构，请让用户在前端「恢复默认」或重新配置
