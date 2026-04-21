package com.nexus.workspace.domain.model.todo;

/**
 * 优先级值对象
 */
public enum Priority {
    LOW(1, "低"),
    MEDIUM(2, "中"),
    HIGH(3, "高");

    private final int code;
    private final String description;

    Priority(int code, String description) {
        this.code = code;
        this.description = description;
    }

    public int getCode() {
        return code;
    }

    public String getDescription() {
        return description;
    }

    public static Priority fromCode(int code) {
        return switch (code) {
            case 1 -> LOW;
            case 2 -> MEDIUM;
            case 3 -> HIGH;
            default -> MEDIUM;
        };
    }
}