package com.nexus.workspace.domain.model.todo;

import com.nexus.workspace.domain.model.todo.TodoStatus;
import com.nexus.workspace.domain.model.todo.Priority;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Todo 聚合根（富领域模型）
 */
@Getter
public class Todo {
    private Long id;
    private Long userId;
    private String title;
    private String description;
    private TodoStatus status;
    private Priority priority;
    private LocalDateTime dueDate;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Todo() {}

    // 创建新 Todo
    public static Todo create(Long userId, String title, String description, Priority priority, LocalDateTime dueDate) {
        Todo todo = new Todo();
        todo.userId = userId;
        todo.title = title;
        todo.description = description;
        todo.status = TodoStatus.PENDING;
        todo.priority = priority != null ? priority : Priority.MEDIUM;
        todo.dueDate = dueDate;
        todo.createdAt = LocalDateTime.now();
        return todo;
    }

    // 更新 Todo 信息
    public void update(String title, String description, TodoStatus status, Priority priority, LocalDateTime dueDate) {
        this.title = title;
        this.description = description;
        if (status != null) {
            changeStatus(status);
        }
        this.priority = priority;
        this.dueDate = dueDate;
        this.updatedAt = LocalDateTime.now();
    }

    // 改变状态（业务行为）
    public void changeStatus(TodoStatus newStatus) {
        if (newStatus.isCompleted() && !this.status.isCompleted()) {
            this.completedAt = LocalDateTime.now();
        }
        this.status = newStatus;
        this.updatedAt = LocalDateTime.now();
    }

    // 完成 Todo
    public void complete() {
        changeStatus(TodoStatus.COMPLETED);
    }

    // 是否属于指定用户
    public boolean belongsTo(Long userId) {
        return this.userId.equals(userId);
    }

    // 是否过期
    public boolean isOverdue() {
        return dueDate != null && dueDate.isBefore(LocalDateTime.now()) && !status.isCompleted();
    }

    // 基础设施层使用的 setter
    public void setId(Long id) {
        this.id = id;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setStatus(TodoStatus status) {
        this.status = status;
    }

    public void setStatusFromCode(int code) {
        this.status = TodoStatus.fromCode(code);
    }

    public void setPriority(Priority priority) {
        this.priority = priority;
    }

    public void setPriorityFromCode(int code) {
        this.priority = Priority.fromCode(code);
    }

    public void setDueDate(LocalDateTime dueDate) {
        this.dueDate = dueDate;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    // 用于基础设施层
    public int getStatusCode() {
        return status != null ? status.getCode() : 0;
    }

    public int getPriorityCode() {
        return priority != null ? priority.getCode() : 2;
    }
}