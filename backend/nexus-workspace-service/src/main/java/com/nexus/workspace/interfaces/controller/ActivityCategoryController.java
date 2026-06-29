package com.nexus.workspace.interfaces.controller;

import com.nexus.common.dto.ApiResponse;
import com.nexus.workspace.application.service.ActivityCategoryApplicationService;
import com.nexus.workspace.interfaces.dto.request.SaveActivityCategoryRequest;
import com.nexus.workspace.interfaces.dto.response.ActivityCategoryResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/activity-categories")
public class ActivityCategoryController {

    private final ActivityCategoryApplicationService categoryApplicationService;

    public ActivityCategoryController(ActivityCategoryApplicationService categoryApplicationService) {
        this.categoryApplicationService = categoryApplicationService;
    }

    @GetMapping
    public ApiResponse<List<ActivityCategoryResponse>> getCategories(@RequestHeader("X-User-Id") Long userId) {
        return ApiResponse.success(categoryApplicationService.getCategories(userId));
    }

    @PostMapping
    public ApiResponse<ActivityCategoryResponse> addCategory(
        @RequestHeader("X-User-Id") Long userId,
        @Valid @RequestBody SaveActivityCategoryRequest request
    ) {
        return ApiResponse.success(categoryApplicationService.addCategory(userId, request));
    }

    @PatchMapping("/{slug}")
    public ApiResponse<ActivityCategoryResponse> updateCategory(
        @RequestHeader("X-User-Id") Long userId,
        @PathVariable String slug,
        @Valid @RequestBody SaveActivityCategoryRequest request
    ) {
        return ApiResponse.success(categoryApplicationService.updateCategory(userId, slug, request));
    }

    @DeleteMapping("/{slug}")
    public ApiResponse<Void> deleteCategory(
        @RequestHeader("X-User-Id") Long userId,
        @PathVariable String slug
    ) {
        categoryApplicationService.deleteCategory(userId, slug);
        return ApiResponse.success();
    }

    @PostMapping("/reset-defaults")
    public ApiResponse<List<ActivityCategoryResponse>> resetCategories(@RequestHeader("X-User-Id") Long userId) {
        return ApiResponse.success(categoryApplicationService.resetCategories(userId));
    }
}
