package com.nexus.workspace.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 更新习惯请求
 */
@Data
public class UpdateHabitRequest {
    @NotBlank(message = "习惯名称不能为空")
    @Size(max = 100, message = "习惯名称最多100字符")
    private String name;

    private String icon;
    private String target;
    private Integer customDays;
}