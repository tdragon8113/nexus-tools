package com.nexus.workspace.interfaces.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * Activity 响应 DTO
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