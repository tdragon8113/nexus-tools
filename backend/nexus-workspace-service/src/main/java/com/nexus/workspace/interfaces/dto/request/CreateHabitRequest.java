package com.nexus.workspace.interfaces.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 创建习惯请求 DTO
 */
@Data
public class CreateHabitRequest {
    @NotBlank(message = "习惯名称不能为空")
    private String name;
    private String icon;
    private String target;
    private Integer customDays;
}