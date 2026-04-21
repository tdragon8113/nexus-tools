package com.nexus.workspace.application.command;

/**
 * 更新习惯命令
 */
public record UpdateHabitCommand(
    Long userId,
    Long habitId,
    String name,
    String icon,
    String target,
    Integer customDays
) {}