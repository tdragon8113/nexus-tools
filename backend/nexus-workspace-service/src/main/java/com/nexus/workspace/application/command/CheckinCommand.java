package com.nexus.workspace.application.command;

import java.time.LocalDate;

/**
 * 打卡命令
 */
public record CheckinCommand(
    Long userId,
    Long habitId,
    LocalDate date
) {
    public CheckinCommand(Long userId, Long habitId) {
        this(userId, habitId, LocalDate.now());
    }
}