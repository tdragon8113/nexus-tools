package com.nexus.workspace.interfaces.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SaveActivityCategoryRequest {
    @NotBlank
    private String id;

    @NotBlank
    private String label;

    @NotBlank
    private String emoji;

    @NotNull
    private Integer xpPerHour;

    private Integer sortOrder;
}
