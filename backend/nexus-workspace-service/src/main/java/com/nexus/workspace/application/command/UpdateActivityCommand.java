package com.nexus.workspace.application.command;

import java.time.LocalDateTime;

/**
 * 更新 Activity 命令
 */
public record UpdateActivityCommand(
    Long userId,
    Long activityId,
    String title,
    String category,
    LocalDateTime endTime,
    Integer durationMinutes,
    Integer mood,
    Integer xp,
    String notes
) {}
