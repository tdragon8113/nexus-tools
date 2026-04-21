package com.nexus.workspace.domain.event;

import com.nexus.workspace.domain.model.habit.HabitId;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 习惯打卡领域事件
 */
public record HabitCheckedInEvent(
    HabitId habitId,
    Long userId,
    LocalDate checkinDate,
    LocalDateTime occurredAt
) {
    public HabitCheckedInEvent(HabitId habitId, Long userId, LocalDate checkinDate) {
        this(habitId, userId, checkinDate, LocalDateTime.now());
    }
}