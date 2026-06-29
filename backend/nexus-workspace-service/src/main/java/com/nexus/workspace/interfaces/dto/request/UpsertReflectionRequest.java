package com.nexus.workspace.interfaces.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpsertReflectionRequest {
    @NotBlank
    private String scope;

    @NotBlank
    private String periodKey;

    @NotBlank
    private String content;
}
