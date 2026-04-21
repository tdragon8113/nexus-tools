package com.nexus.workspace.interfaces.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 创建 Todo 请求 DTO
 */
@Data
public class CreateTodoRequest {
    @NotBlank(message = "标题不能为空")
    private String title;
    private String description;
    private Integer priority;
    private LocalDateTime dueDate;
}