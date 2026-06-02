package com.nexus.workspace.interfaces.controller;

import com.nexus.common.dto.ApiResponse;
import com.nexus.workspace.application.command.CreateActivityCommand;
import com.nexus.workspace.application.command.UpdateActivityCommand;
import com.nexus.workspace.application.service.ActivityApplicationService;
import com.nexus.workspace.domain.model.activity.ActivityCategory;
import com.nexus.workspace.interfaces.dto.request.CreateActivityRequest;
import com.nexus.workspace.interfaces.dto.request.UpdateActivityRequest;
import com.nexus.workspace.interfaces.dto.response.ActivityResponse;
import com.nexus.workspace.interfaces.dto.response.StatsResponse;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Activity 控制器（接口层）
 */
@Slf4j
@RestController
@RequestMapping("/activities")
public class ActivityController {

    private final ActivityApplicationService activityApplicationService;

    public ActivityController(ActivityApplicationService activityApplicationService) {
        this.activityApplicationService = activityApplicationService;
    }

    @PostMapping
    public ApiResponse<ActivityResponse> createActivity(
        @RequestHeader("X-User-Id") Long userId,
        @Valid @RequestBody CreateActivityRequest request
    ) {
        CreateActivityCommand command = new CreateActivityCommand(
            userId,
            request.getTitle(),
            ActivityCategory.fromString(request.getCategory()),
            request.getStartTime(),
            request.getEndTime(),
            request.getDurationMinutes(),
            request.getNotes()
        );
        return ApiResponse.success(activityApplicationService.createActivity(command));
    }

    @GetMapping
    public ApiResponse<List<ActivityResponse>> getActivities(@RequestHeader("X-User-Id") Long userId) {
        return ApiResponse.success(activityApplicationService.getActivities(userId));
    }

    @GetMapping("/ongoing")
    public ApiResponse<ActivityResponse> getOngoingActivity(@RequestHeader("X-User-Id") Long userId) {
        ActivityResponse ongoing = activityApplicationService.getOngoingActivity(userId);
        return ApiResponse.success(ongoing);
    }

    @PatchMapping("/{id}")
    public ApiResponse<ActivityResponse> updateActivity(
        @RequestHeader("X-User-Id") Long userId,
        @PathVariable("id") Long id,
        @Valid @RequestBody UpdateActivityRequest request
    ) {
        UpdateActivityCommand command = new UpdateActivityCommand(
            userId,
            id,
            request.getTitle(),
            request.getEndTime(),
            request.getDurationMinutes(),
            request.getNotes()
        );
        return ApiResponse.success(activityApplicationService.updateActivity(command));
    }

    @GetMapping("/stats")
    public ApiResponse<StatsResponse> getStats(@RequestHeader("X-User-Id") Long userId) {
        return ApiResponse.success(activityApplicationService.getStats(userId));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteActivity(
        @RequestHeader("X-User-Id") Long userId,
        @PathVariable("id") Long id
    ) {
        activityApplicationService.deleteActivity(userId, id);
        return ApiResponse.success();
    }
}