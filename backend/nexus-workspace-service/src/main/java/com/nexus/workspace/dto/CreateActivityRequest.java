package com.nexus.workspace.dto;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 创建番茄专注记录请求
 */
@Data
public class CreateActivityRequest {
    private String title;       // 专注内容描述
    private String category;    // pomodoro-work / pomodoro-break
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer durationMinutes;
    private String notes;
}