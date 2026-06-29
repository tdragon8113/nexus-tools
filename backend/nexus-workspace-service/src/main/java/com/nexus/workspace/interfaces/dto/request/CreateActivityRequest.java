package com.nexus.workspace.interfaces.dto.request;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CreateActivityRequest {
    private String title;
    private String category;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer durationMinutes;
    /** 心情 1-5 */
    private Integer mood;
    private Integer xp;
    private String notes;
}
