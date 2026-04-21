package com.nexus.workspace.dto;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 日程响应
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