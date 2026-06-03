package com.nexus.workspace.interfaces.dto.lifecard;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LifeCardChildDto {
    @Size(max = 64)
    private String id;

    @NotBlank
    @Size(max = 32)
    private String label;
}
