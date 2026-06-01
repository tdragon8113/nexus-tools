package com.nexus.workspace.interfaces.dto.request;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 更新 Activity 请求 DTO
 */
@Data
public class UpdateActivityRequest {
    private String title;
    private LocalDateTime endTime;
    private Integer durationMinutes;
    private String notes;
}
