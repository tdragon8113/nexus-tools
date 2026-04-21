package com.nexus.workspace.controller;

import com.nexus.common.dto.ApiResponse;
import com.nexus.workspace.dto.CreateTodoRequest;
import com.nexus.workspace.dto.TodoResponse;
import com.nexus.workspace.dto.UpdateTodoRequest;
import com.nexus.workspace.service.TodoService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/todos")
public class TodoController {

    private final TodoService todoService;

    public TodoController(TodoService todoService) {
        this.todoService = todoService;
    }

    @PostMapping
    public ApiResponse<TodoResponse> createTodo(
        @RequestHeader("X-User-Id") Long userId,
        @Valid @RequestBody CreateTodoRequest request
    ) {
        return ApiResponse.success(todoService.createTodo(userId, request));
    }

    @GetMapping
    public ApiResponse<List<TodoResponse>> getTodos(
        @RequestHeader("X-User-Id") Long userId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime date,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        if (date != null) {
            return ApiResponse.success(todoService.getTodosByDate(userId, date));
        }
        if (startDate != null && endDate != null) {
            return ApiResponse.success(todoService.getTodosByDateRange(userId, startDate, endDate));
        }
        return ApiResponse.success(todoService.getTodos(userId));
    }

    @GetMapping("/{id}")
    public ApiResponse<TodoResponse> getTodo(
        @RequestHeader("X-User-Id") Long userId,
        @PathVariable Long id
    ) {
        // 通过 getTodos 过滤用户权限，这里简化处理
        return ApiResponse.success(todoService.getTodos(userId).stream()
            .filter(t -> t.getId().equals(id))
            .findFirst()
            .orElseThrow(() -> new RuntimeException("日程不存在")));
    }

    @PutMapping("/{id}")
    public ApiResponse<TodoResponse> updateTodo(
        @RequestHeader("X-User-Id") Long userId,
        @PathVariable Long id,
        @Valid @RequestBody UpdateTodoRequest request
    ) {
        return ApiResponse.success(todoService.updateTodo(userId, id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteTodo(
        @RequestHeader("X-User-Id") Long userId,
        @PathVariable Long id
    ) {
        todoService.deleteTodo(userId, id);
        return ApiResponse.success();
    }
}