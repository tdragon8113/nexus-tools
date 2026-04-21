package com.nexus.workspace.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 更新日程请求
 */
@Data
public class UpdateTodoRequest {
    @NotBlank(message = "标题不能为空")
    private String title;

    private String description;
    private Integer status;      // 0:待办, 1:进行中, 2:已完成
    private Integer priority;
    private LocalDateTime dueDate;
}