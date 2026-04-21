package com.nexus.workspace.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 创建习惯请求
 */
@Data
public class CreateHabitRequest {
    @NotBlank(message = "习惯名称不能为空")
    @Size(max = 100, message = "习惯名称最多100字符")
    private String name;

    private String icon;           // Vant icon name
    private String target;         // daily, weekly, custom
    private Integer customDays;    // 自定义天数（target=custom 时必填）
}