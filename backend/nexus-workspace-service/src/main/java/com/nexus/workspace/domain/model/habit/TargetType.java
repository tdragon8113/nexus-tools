package com.nexus.workspace.domain.model.habit;

import java.time.DayOfWeek;
import java.time.LocalDate;

/**
 * 目标类型值对象
 */
public enum TargetType {
    DAILY("每日"),
    WEEKLY("每周"),
    CUSTOM("自定义");

    private final String description;

    TargetType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }

    public boolean shouldCheckin(LocalDate date, Integer customDays) {
        switch (this) {
            case DAILY:
                return true;
            case WEEKLY:
                return true;
            case CUSTOM:
                return customDays != null && customDays > 0;
            default:
                return true;
        }
    }

    public static TargetType fromString(String value) {
        if (value == null) return DAILY;
        return switch (value.toLowerCase()) {
            case "daily" -> DAILY;
            case "weekly" -> WEEKLY;
            case "custom" -> CUSTOM;
            default -> DAILY;
        };
    }

    public String toDbValue() {
        return name().toLowerCase();
    }
}