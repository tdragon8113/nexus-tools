package com.nexus.workspace.entity;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 习惯追踪实体
 */
@Data
public class Habit {
    private Long id;
    private Long userId;
    private String name;
    private String icon;
    private String target;      // daily, weekly, custom
    private Integer customDays; // 自定义天数
    private Integer version;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}