package com.nexus.workspace.domain.model.habit;

/**
 * 习惯 ID 值对象
 */
public record HabitId(Long value) {
    public HabitId {
        if (value == null || value <= 0) {
            throw new IllegalArgumentException("无效的习惯 ID");
        }
    }
}