package com.nexus.workspace.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class Todo {
    private Long id;
    private Long userId;
    private String title;
    private String description;
    private Integer status;      // 0: 待办, 1: 进行中, 2: 已完成, 3: 已删除
    private Integer priority;    // 1: 低, 2: 中, 3: 高
    private LocalDateTime dueDate;
    private LocalDateTime completedAt;
    private Integer version;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}