package com.nexus.workspace.application.service;

import com.nexus.common.support.ResourceAccessChecker;
import com.nexus.workspace.application.command.CreateTodoCommand;
import com.nexus.workspace.application.command.UpdateTodoCommand;
import com.nexus.workspace.domain.model.todo.Priority;
import com.nexus.workspace.domain.model.todo.Todo;
import com.nexus.workspace.domain.model.todo.TodoStatus;
import com.nexus.workspace.domain.repository.TodoRepository;
import com.nexus.workspace.interfaces.dto.response.TodoResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Todo 应用服务
 */
@Slf4j
@Service
public class TodoApplicationService {

    private final TodoRepository todoRepository;

    public TodoApplicationService(TodoRepository todoRepository) {
        this.todoRepository = todoRepository;
    }

    @Transactional
    public TodoResponse createTodo(CreateTodoCommand command) {
        Todo todo = Todo.create(
            command.userId(),
            command.title(),
            command.description(),
            command.priority(),
            command.dueDate()
        );
        todoRepository.save(todo);
        log.info("Todo created: userId={}, title={}", command.userId(), command.title());
        return toResponse(todo);
    }

    public List<TodoResponse> getTodos(Long userId) {
        List<Todo> todos = todoRepository.findByUserId(userId);
        return todos.stream().map(this::toResponse).toList();
    }

    public List<TodoResponse> getTodosByDate(Long userId, LocalDateTime date) {
        List<Todo> todos = todoRepository.findByUserIdAndDate(userId, date);
        return todos.stream().map(this::toResponse).toList();
    }

    public List<TodoResponse> getTodosByDateRange(Long userId, LocalDateTime start, LocalDateTime end) {
        List<Todo> todos = todoRepository.findByUserIdAndDateRange(userId, start, end);
        return todos.stream().map(this::toResponse).toList();
    }

    @Transactional
    public TodoResponse updateTodo(UpdateTodoCommand command) {
        Todo todo = ResourceAccessChecker.requireOwned(
            todoRepository.findById(command.todoId()),
            t -> t.belongsTo(command.userId()),
            "日程"
        );

        todo.update(
            command.title(),
            command.description(),
            command.status(),
            command.priority(),
            command.dueDate()
        );
        todoRepository.save(todo);
        log.info("Todo updated: todoId={}", command.todoId());
        return toResponse(todo);
    }

    @Transactional
    public void deleteTodo(Long userId, Long todoId) {
        ResourceAccessChecker.requireOwned(
            todoRepository.findById(todoId),
            t -> t.belongsTo(userId),
            "日程"
        );
        todoRepository.delete(todoId);
        log.info("Todo deleted: todoId={}", todoId);
    }

    private TodoResponse toResponse(Todo todo) {
        TodoResponse response = new TodoResponse();
        response.setId(todo.getId());
        response.setTitle(todo.getTitle());
        response.setDescription(todo.getDescription());
        response.setStatus(todo.getStatusCode());
        response.setPriority(todo.getPriorityCode());
        response.setDueDate(todo.getDueDate());
        response.setCompletedAt(todo.getCompletedAt());
        response.setCreatedAt(todo.getCreatedAt());
        return response;
    }
}