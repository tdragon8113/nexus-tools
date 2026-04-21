package com.nexus.workspace.interfaces.dto.request;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 创建 Activity 请求 DTO
 */
@Data
public class CreateActivityRequest {
    private String title;
    private String category;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer durationMinutes;
    private String notes;
}