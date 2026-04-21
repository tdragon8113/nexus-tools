package com.nexus.workspace.interfaces.controller;

import com.nexus.common.dto.ApiResponse;
import com.nexus.workspace.application.command.CreateTodoCommand;
import com.nexus.workspace.application.command.UpdateTodoCommand;
import com.nexus.workspace.application.service.TodoApplicationService;
import com.nexus.workspace.domain.model.todo.Priority;
import com.nexus.workspace.domain.model.todo.TodoStatus;
import com.nexus.workspace.interfaces.dto.request.CreateTodoRequest;
import com.nexus.workspace.interfaces.dto.request.UpdateTodoRequest;
import com.nexus.workspace.interfaces.dto.response.TodoResponse;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Todo 控制器（接口层）
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/todos")
public class TodoController {

    private final TodoApplicationService todoApplicationService;

    public TodoController(TodoApplicationService todoApplicationService) {
        this.todoApplicationService = todoApplicationService;
    }

    @PostMapping
    public ApiResponse<TodoResponse> createTodo(
        @RequestHeader("X-User-Id") Long userId,
        @Valid @RequestBody CreateTodoRequest request
    ) {
        CreateTodoCommand command = new CreateTodoCommand(
            userId,
            request.getTitle(),
            request.getDescription(),
            Priority.fromCode(request.getPriority() != null ? request.getPriority() : 2),
            request.getDueDate()
        );
        return ApiResponse.success(todoApplicationService.createTodo(command));
    }

    @GetMapping
    public ApiResponse<List<TodoResponse>> getTodos(@RequestHeader("X-User-Id") Long userId) {
        return ApiResponse.success(todoApplicationService.getTodos(userId));
    }

    @GetMapping("/date/{date}")
    public ApiResponse<List<TodoResponse>> getTodosByDate(
        @RequestHeader("X-User-Id") Long userId,
        @PathVariable LocalDateTime date
    ) {
        return ApiResponse.success(todoApplicationService.getTodosByDate(userId, date));
    }

    @GetMapping("/range")
    public ApiResponse<List<TodoResponse>> getTodosByDateRange(
        @RequestHeader("X-User-Id") Long userId,
        @RequestParam LocalDateTime start,
        @RequestParam LocalDateTime end
    ) {
        return ApiResponse.success(todoApplicationService.getTodosByDateRange(userId, start, end));
    }

    @PutMapping("/{id}")
    public ApiResponse<TodoResponse> updateTodo(
        @RequestHeader("X-User-Id") Long userId,
        @PathVariable Long id,
        @Valid @RequestBody UpdateTodoRequest request
    ) {
        UpdateTodoCommand command = new UpdateTodoCommand(
            userId,
            id,
            request.getTitle(),
            request.getDescription(),
            TodoStatus.fromCode(request.getStatus() != null ? request.getStatus() : 0),
            Priority.fromCode(request.getPriority() != null ? request.getPriority() : 2),
            request.getDueDate()
        );
        return ApiResponse.success(todoApplicationService.updateTodo(command));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteTodo(
        @RequestHeader("X-User-Id") Long userId,
        @PathVariable Long id
    ) {
        todoApplicationService.deleteTodo(userId, id);
        return ApiResponse.success();
    }
}