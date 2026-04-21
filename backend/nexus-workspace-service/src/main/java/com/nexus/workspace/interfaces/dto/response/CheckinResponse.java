package com.nexus.workspace.interfaces.dto.response;

import lombok.Data;

import java.time.LocalDate;

/**
 * 打卡响应 DTO
 */
@Data
public class CheckinResponse {
    private Long id;
    private Long habitId;
    private LocalDate checkinDate;
    private Boolean checked;
}