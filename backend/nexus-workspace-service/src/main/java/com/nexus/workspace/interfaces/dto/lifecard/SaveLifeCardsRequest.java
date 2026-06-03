package com.nexus.workspace.interfaces.dto.lifecard;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class SaveLifeCardsRequest {
    @NotEmpty
    @Valid
    private List<LifeCardDto> cards;
}
