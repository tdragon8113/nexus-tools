package com.nexus.workspace.domain.model.todo;

/**
 * Todo 状态值对象
 */
public enum TodoStatus {
    PENDING(0, "待办"),
    IN_PROGRESS(1, "进行中"),
    COMPLETED(2, "已完成");

    private final int code;
    private final String description;

    TodoStatus(int code, String description) {
        this.code = code;
        this.description = description;
    }

    public int getCode() {
        return code;
    }

    public String getDescription() {
        return description;
    }

    public static TodoStatus fromCode(int code) {
        return switch (code) {
            case 0 -> PENDING;
            case 1 -> IN_PROGRESS;
            case 2 -> COMPLETED;
            default -> PENDING;
        };
    }

    public boolean isCompleted() {
        return this == COMPLETED;
    }
}