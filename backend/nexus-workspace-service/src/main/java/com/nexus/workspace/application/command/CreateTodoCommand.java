package com.nexus.workspace.application.command;

import com.nexus.workspace.domain.model.todo.Priority;
import com.nexus.workspace.domain.model.todo.TodoStatus;

import java.time.LocalDateTime;

/**
 * 创建 Todo 命令
 */
public record CreateTodoCommand(
    Long userId,
    String title,
    String description,
    Priority priority,
    LocalDateTime dueDate
) {}