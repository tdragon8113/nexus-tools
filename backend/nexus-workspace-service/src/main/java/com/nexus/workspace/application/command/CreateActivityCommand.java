package com.nexus.workspace.application.command;

import com.nexus.workspace.domain.model.activity.ActivityCategory;

import java.time.LocalDateTime;

/**
 * 创建 Activity 命令
 */
public record CreateActivityCommand(
    Long userId,
    String title,
    ActivityCategory category,
    LocalDateTime startTime,
    LocalDateTime endTime,
    Integer durationMinutes,
    String notes
) {}