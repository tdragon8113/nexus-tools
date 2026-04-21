package com.nexus.workspace.domain.repository;

import com.nexus.workspace.domain.model.todo.Todo;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Todo 仓储接口
 */
public interface TodoRepository {
    Todo findById(Long id);
    List<Todo> findByUserId(Long userId);
    List<Todo> findByUserIdAndDate(Long userId, LocalDateTime date);
    List<Todo> findByUserIdAndDateRange(Long userId, LocalDateTime startDate, LocalDateTime endDate);
    void save(Todo todo);
    void delete(Long id);
}