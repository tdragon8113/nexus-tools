package com.nexus.workspace.application.command;

import java.time.LocalDateTime;

/**
 * 创建 Activity 命令
 */
public record CreateActivityCommand(
    Long userId,
    String title,
    String category,
    LocalDateTime startTime,
    LocalDateTime endTime,
    Integer durationMinutes,
    Integer mood,
    Integer xp,
    String notes
) {}
