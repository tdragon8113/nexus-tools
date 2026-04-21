package com.nexus.workspace.domain.model.activity;

/**
 * Activity 类型值对象
 */
public enum ActivityCategory {
    POMODORO_WORK("pomodoro-work", "番茄专注"),
    POMODORO_BREAK("pomodoro-break", "番茄休息"),
    MEETING("meeting", "会议"),
    OTHER("other", "其他");

    private final String code;
    private final String description;

    ActivityCategory(String code, String description) {
        this.code = code;
        this.description = description;
    }

    public String getCode() {
        return code;
    }

    public String getDescription() {
        return description;
    }

    public static ActivityCategory fromString(String value) {
        if (value == null) return POMODORO_WORK;
        return switch (value.toLowerCase()) {
            case "pomodoro-work" -> POMODORO_WORK;
            case "pomodoro-break" -> POMODORO_BREAK;
            case "meeting" -> MEETING;
            default -> OTHER;
        };
    }

    public boolean isPomodoroWork() {
        return this == POMODORO_WORK;
    }
}