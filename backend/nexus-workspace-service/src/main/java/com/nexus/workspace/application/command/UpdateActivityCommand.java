package com.nexus.workspace.application.command;

import java.time.LocalDateTime;

/**
 * 更新 Activity 命令（结束记录或补充总结）
 */
public record UpdateActivityCommand(
    Long userId,
    Long activityId,
    String title,
    LocalDateTime endTime,
    Integer durationMinutes,
    String notes
) {}
