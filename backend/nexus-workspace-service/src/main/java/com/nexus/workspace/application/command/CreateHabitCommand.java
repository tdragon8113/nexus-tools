package com.nexus.workspace.application.command;

/**
 * 创建习惯命令
 */
public record CreateHabitCommand(
    Long userId,
    String name,
    String icon,
    String target,
    Integer customDays
) {}