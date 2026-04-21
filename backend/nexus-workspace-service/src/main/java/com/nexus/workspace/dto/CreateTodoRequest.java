package com.nexus.workspace.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 创建日程请求
 */
@Data
public class CreateTodoRequest {
    @NotBlank(message = "标题不能为空")
    @Size(max = 200, message = "标题最多200字符")
    private String title;

    private String description;
    private Integer priority;      // 1:低, 2:中, 3:高
    private LocalDateTime dueDate; // 日程日期时间
}