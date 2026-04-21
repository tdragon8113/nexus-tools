package com.nexus.workspace.interfaces.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * Todo 响应 DTO
 */
@Data
public class TodoResponse {
    private Long id;
    private String title;
    private String description;
    private Integer status;
    private Integer priority;
    private LocalDateTime dueDate;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
}