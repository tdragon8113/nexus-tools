package com.nexus.workspace.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class Activity {
    private Long id;
    private Long userId;
    private String title;
    private String category;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer durationMinutes;
    private String notes;
    private Integer version;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}