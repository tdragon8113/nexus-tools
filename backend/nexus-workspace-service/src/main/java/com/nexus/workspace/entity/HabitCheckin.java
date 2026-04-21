package com.nexus.workspace.entity;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 习惯打卡记录实体
 */
@Data
public class HabitCheckin {
    private Long id;
    private Long habitId;
    private Long userId;
    private LocalDate checkinDate;
    private LocalDateTime createdAt;
}