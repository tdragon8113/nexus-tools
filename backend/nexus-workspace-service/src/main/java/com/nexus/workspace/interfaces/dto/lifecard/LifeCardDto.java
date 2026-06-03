package com.nexus.workspace.interfaces.dto.lifecard;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class LifeCardDto {
    @Size(max = 64)
    private String id;

    @NotBlank
    @Size(max = 32)
    private String label;

    @Valid
    private List<LifeCardChildDto> children = new ArrayList<>();
}
