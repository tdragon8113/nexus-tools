package com.nexus.workspace.application.command;

import com.nexus.workspace.domain.model.todo.Priority;
import com.nexus.workspace.domain.model.todo.TodoStatus;

import java.time.LocalDateTime;

/**
 * 更新 Todo 命令
 */
public record UpdateTodoCommand(
    Long userId,
    Long todoId,
    String title,
    String description,
    TodoStatus status,
    Priority priority,
    LocalDateTime dueDate
) {}