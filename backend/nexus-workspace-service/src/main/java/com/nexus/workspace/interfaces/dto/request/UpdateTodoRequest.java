package com.nexus.workspace.interfaces.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 更新 Todo 请求 DTO
 */
@Data
public class UpdateTodoRequest {
    @NotBlank(message = "标题不能为空")
    private String title;
    private String description;
    private Integer status;
    private Integer priority;
    private LocalDateTime dueDate;
}