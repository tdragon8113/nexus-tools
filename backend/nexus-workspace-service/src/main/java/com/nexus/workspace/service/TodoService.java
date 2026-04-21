package com.nexus.workspace.service;

import com.nexus.common.exception.BusinessException;
import com.nexus.workspace.dto.CreateTodoRequest;
import com.nexus.workspace.dto.TodoResponse;
import com.nexus.workspace.dto.UpdateTodoRequest;
import com.nexus.workspace.entity.Todo;
import com.nexus.workspace.mapper.TodoMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
public class TodoService {

    private final TodoMapper todoMapper;

    public TodoService(TodoMapper todoMapper) {
        this.todoMapper = todoMapper;
    }

    @Transactional
    public TodoResponse createTodo(Long userId, CreateTodoRequest request) {
        Todo todo = new Todo();
        todo.setUserId(userId);
        todo.setTitle(request.getTitle());
        todo.setDescription(request.getDescription());
        todo.setStatus(0); // 待办
        todo.setPriority(request.getPriority() != null ? request.getPriority() : 2);
        todo.setDueDate(request.getDueDate());
        todo.setCreatedAt(LocalDateTime.now());

        todoMapper.insert(todo);
        log.info("Todo created: userId={}, todoId={}", userId, todo.getId());

        return toResponse(todo);
    }

    public List<TodoResponse> getTodos(Long userId) {
        List<Todo> todos = todoMapper.findByUserId(userId);
        return todos.stream().map(this::toResponse).toList();
    }

    public List<TodoResponse> getTodosByDate(Long userId, LocalDateTime date) {
        List<Todo> todos = todoMapper.findByUserIdAndDate(userId, date);
        return todos.stream().map(this::toResponse).toList();
    }

    public List<TodoResponse> getTodosByDateRange(Long userId, LocalDateTime start, LocalDateTime end) {
        List<Todo> todos = todoMapper.findByUserIdAndDateRange(userId, start, end);
        return todos.stream().map(this::toResponse).toList();
    }

    @Transactional
    public TodoResponse updateTodo(Long userId, Long todoId, UpdateTodoRequest request) {
        Todo todo = todoMapper.selectById(todoId);
        if (todo == null || !todo.getUserId().equals(userId)) {
            throw new BusinessException(404, "日程不存在");
        }

        todo.setTitle(request.getTitle());
        todo.setDescription(request.getDescription());
        if (request.getStatus() != null) {
            todo.setStatus(request.getStatus());
            if (request.getStatus() == 2) { // 已完成
                todo.setCompletedAt(LocalDateTime.now());
            }
        }
        todo.setPriority(request.getPriority());
        todo.setDueDate(request.getDueDate());
        todo.setUpdatedAt(LocalDateTime.now());

        todoMapper.updateById(todo);
        log.info("Todo updated: todoId={}", todoId);

        return toResponse(todo);
    }

    @Transactional
    public void deleteTodo(Long userId, Long todoId) {
        Todo todo = todoMapper.selectById(todoId);
        if (todo == null || !todo.getUserId().equals(userId)) {
            throw new BusinessException(404, "日程不存在");
        }

        todoMapper.deleteById(todoId);
        log.info("Todo deleted: todoId={}", todoId);
    }

    private TodoResponse toResponse(Todo todo) {
        TodoResponse response = new TodoResponse();
        response.setId(todo.getId());
        response.setTitle(todo.getTitle());
        response.setDescription(todo.getDescription());
        response.setStatus(todo.getStatus());
        response.setPriority(todo.getPriority());
        response.setDueDate(todo.getDueDate());
        response.setCompletedAt(todo.getCompletedAt());
        response.setCreatedAt(todo.getCreatedAt());
        return response;
    }
}