package com.nexus.workspace.dto;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 番茄专注记录响应
 */
@Data
public class ActivityResponse {
    private Long id;
    private String title;
    private String category;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer durationMinutes;
    private String notes;
    private LocalDateTime createdAt;
}