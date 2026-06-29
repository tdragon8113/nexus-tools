package com.nexus.workspace.interfaces.dto.request;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UpdateActivityRequest {
    private String title;
    private String category;
    private LocalDateTime endTime;
    private Integer durationMinutes;
    private Integer mood;
    private Integer xp;
    private String notes;
}
