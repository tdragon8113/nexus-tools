package com.nexus.workspace.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 习惯响应
 */
@Data
public class HabitResponse {
    private Long id;
    private String name;
    private String icon;
    private String target;
    private Integer customDays;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer streakDays;        // 连续打卡天数
    private List<String> recentCheckins; // 最近30天打卡日期
}