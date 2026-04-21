package com.nexus.workspace.controller;

import com.nexus.common.dto.ApiResponse;
import com.nexus.workspace.dto.ActivityResponse;
import com.nexus.workspace.dto.CreateActivityRequest;
import com.nexus.workspace.dto.StatsResponse;
import com.nexus.workspace.service.ActivityService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/activities")
public class ActivityController {

    private final ActivityService activityService;

    public ActivityController(ActivityService activityService) {
        this.activityService = activityService;
    }

    @PostMapping
    public ApiResponse<ActivityResponse> createActivity(
        @RequestHeader("X-User-Id") Long userId,
        @Valid @RequestBody CreateActivityRequest request
    ) {
        return ApiResponse.success(activityService.createActivity(userId, request));
    }

    @GetMapping
    public ApiResponse<List<ActivityResponse>> getActivities(@RequestHeader("X-User-Id") Long userId) {
        return ApiResponse.success(activityService.getActivities(userId));
    }

    @GetMapping("/stats")
    public ApiResponse<StatsResponse> getStats(@RequestHeader("X-User-Id") Long userId) {
        return ApiResponse.success(activityService.getStats(userId));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteActivity(
        @RequestHeader("X-User-Id") Long userId,
        @PathVariable Long id
    ) {
        activityService.deleteActivity(userId, id);
        return ApiResponse.success();
    }
}