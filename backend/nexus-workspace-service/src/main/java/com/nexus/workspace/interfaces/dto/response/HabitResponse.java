package com.nexus.workspace.interfaces.dto.response;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 习惯响应 DTO
 */
@Data
public class HabitResponse {
    private Long id;
    private String name;
    private String icon;
    private String target;
    private Integer customDays;
    private Integer streakDays;
    private List<String> recentCheckins;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}