package com.nexus.workspace.interfaces.controller;

import com.nexus.common.dto.ApiResponse;
import com.nexus.workspace.application.service.LifeCardApplicationService;
import com.nexus.workspace.interfaces.dto.lifecard.LifeCardDto;
import com.nexus.workspace.interfaces.dto.lifecard.SaveLifeCardsRequest;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/life-cards")
public class LifeCardController {

    private final LifeCardApplicationService lifeCardApplicationService;

    public LifeCardController(LifeCardApplicationService lifeCardApplicationService) {
        this.lifeCardApplicationService = lifeCardApplicationService;
    }

    @GetMapping
    public ApiResponse<List<LifeCardDto>> getLifeCards(@RequestHeader("X-User-Id") Long userId) {
        return ApiResponse.success(lifeCardApplicationService.getLifeCards(userId));
    }

    @PutMapping
    public ApiResponse<List<LifeCardDto>> saveLifeCards(
        @RequestHeader("X-User-Id") Long userId,
        @Valid @RequestBody SaveLifeCardsRequest request
    ) {
        return ApiResponse.success(lifeCardApplicationService.saveLifeCards(userId, request.getCards()));
    }

    @PostMapping("/reset-defaults")
    public ApiResponse<List<LifeCardDto>> resetLifeCards(@RequestHeader("X-User-Id") Long userId) {
        return ApiResponse.success(lifeCardApplicationService.resetLifeCards(userId));
    }
}
