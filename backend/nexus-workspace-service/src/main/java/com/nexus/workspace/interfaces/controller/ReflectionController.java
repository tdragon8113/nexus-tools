package com.nexus.workspace.interfaces.controller;

import com.nexus.common.dto.ApiResponse;
import com.nexus.workspace.application.service.ReflectionApplicationService;
import com.nexus.workspace.interfaces.dto.request.UpsertReflectionRequest;
import com.nexus.workspace.interfaces.dto.response.ReflectionResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reflections")
public class ReflectionController {

    private final ReflectionApplicationService reflectionApplicationService;

    public ReflectionController(ReflectionApplicationService reflectionApplicationService) {
        this.reflectionApplicationService = reflectionApplicationService;
    }

    @GetMapping
    public ApiResponse<List<ReflectionResponse>> getReflections(@RequestHeader("X-User-Id") Long userId) {
        return ApiResponse.success(reflectionApplicationService.getReflections(userId));
    }

    @PutMapping
    public ApiResponse<ReflectionResponse> upsertReflection(
        @RequestHeader("X-User-Id") Long userId,
        @Valid @RequestBody UpsertReflectionRequest request
    ) {
        return ApiResponse.success(reflectionApplicationService.upsertReflection(userId, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteReflection(
        @RequestHeader("X-User-Id") Long userId,
        @PathVariable Long id
    ) {
        reflectionApplicationService.deleteReflection(userId, id);
        return ApiResponse.success();
    }
}
