package com.nexus.workspace.infrastructure.persistence.repository;

import com.nexus.workspace.domain.model.todo.Todo;
import com.nexus.workspace.domain.repository.TodoRepository;
import com.nexus.workspace.infrastructure.persistence.mapper.TodoMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Todo 仓储实现（持久化层）
 */
@Slf4j
@Repository
public class TodoRepositoryImpl implements TodoRepository {

    private final TodoMapper todoMapper;

    public TodoRepositoryImpl(TodoMapper todoMapper) {
        this.todoMapper = todoMapper;
    }

    @Override
    public Todo findById(Long id) {
        return todoMapper.selectById(id);
    }

    @Override
    public List<Todo> findByUserId(Long userId) {
        return todoMapper.findByUserId(userId);
    }

    @Override
    public List<Todo> findByUserIdAndDate(Long userId, LocalDateTime date) {
        return todoMapper.findByUserIdAndDate(userId, date);
    }

    @Override
    public List<Todo> findByUserIdAndDateRange(Long userId, LocalDateTime startDate, LocalDateTime endDate) {
        return todoMapper.findByUserIdAndDateRange(userId, startDate, endDate);
    }

    @Override
    public void save(Todo todo) {
        if (todo.getId() == null) {
            todoMapper.insert(todo);
        } else {
            todoMapper.updateById(todo);
        }
    }

    @Override
    public void delete(Long id) {
        todoMapper.deleteById(id);
    }
}