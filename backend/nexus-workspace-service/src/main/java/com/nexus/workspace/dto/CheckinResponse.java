package com.nexus.workspace.dto;

import lombok.Data;
import java.time.LocalDate;

/**
 * 打卡记录响应
 */
@Data
public class CheckinResponse {
    private Long id;
    private Long habitId;
    private LocalDate checkinDate;
    private Boolean checked;       // 是否已打卡
}