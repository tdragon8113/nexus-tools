package com.nexus.workspace.domain.model.habit;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 习惯打卡实体
 */
public class HabitCheckin {
    private Long id;
    private HabitId habitId;
    private Long userId;
    private LocalDate checkinDate;
    private LocalDateTime createdAt;

    public HabitCheckin() {}

    public HabitCheckin(HabitId habitId, Long userId, LocalDate date) {
        this.habitId = habitId;
        this.userId = userId;
        this.checkinDate = date;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public HabitId getHabitId() {
        return habitId;
    }

    public void setHabitId(HabitId habitId) {
        this.habitId = habitId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public LocalDate getCheckinDate() {
        return checkinDate;
    }

    public void setCheckinDate(LocalDate checkinDate) {
        this.checkinDate = checkinDate;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    // 用于基础设施层的转换方法
    public Long getHabitIdValue() {
        return habitId != null ? habitId.value() : null;
    }

    public void setHabitIdValue(Long value) {
        this.habitId = value != null ? new HabitId(value) : null;
    }
}