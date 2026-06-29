package com.nexus.workspace.interfaces.controller;

import com.nexus.common.dto.ApiResponse;
import com.nexus.workspace.application.command.CreateActivityCommand;
import com.nexus.workspace.application.command.UpdateActivityCommand;
import com.nexus.workspace.application.service.ActivityAnalyticsService;
import com.nexus.workspace.application.service.ActivityApplicationService;
import com.nexus.workspace.application.service.ActivitySummaryService;
import com.nexus.workspace.interfaces.dto.request.CreateActivityRequest;
import com.nexus.workspace.interfaces.dto.request.UpdateActivityRequest;
import com.nexus.workspace.interfaces.dto.response.ActivityAnalyticsResponse;
import com.nexus.workspace.interfaces.dto.response.ActivityResponse;
import com.nexus.workspace.interfaces.dto.response.ActivitySummaryResponse;
import com.nexus.workspace.interfaces.dto.response.StatsResponse;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/activities")
public class ActivityController {

    private final ActivityApplicationService activityApplicationService;
    private final ActivityAnalyticsService activityAnalyticsService;
    private final ActivitySummaryService activitySummaryService;

    public ActivityController(
        ActivityApplicationService activityApplicationService,
        ActivityAnalyticsService activityAnalyticsService,
        ActivitySummaryService activitySummaryService
    ) {
        this.activityApplicationService = activityApplicationService;
        this.activityAnalyticsService = activityAnalyticsService;
        this.activitySummaryService = activitySummaryService;
    }

    @PostMapping
    public ApiResponse<ActivityResponse> createActivity(
        @RequestHeader("X-User-Id") Long userId,
        @Valid @RequestBody CreateActivityRequest request
    ) {
        CreateActivityCommand command = new CreateActivityCommand(
            userId,
            request.getTitle(),
            request.getCategory(),
            request.getStartTime(),
            request.getEndTime(),
            request.getDurationMinutes(),
            request.getMood(),
            request.getXp(),
            request.getNotes()
        );
        return ApiResponse.success(activityApplicationService.createActivity(command));
    }

    /**
     * List activities for the user. When {@code from} and {@code to} are both provided (YYYY-MM-DD),
     * results are filtered by {@code start_time} between {@code from 00:00:00} and {@code to 23:59:59}.
     */
    @GetMapping
    public ApiResponse<List<ActivityResponse>> getActivities(
        @RequestHeader("X-User-Id") Long userId,
        @RequestParam(required = false) String from,
        @RequestParam(required = false) String to
    ) {
        return ApiResponse.success(activityApplicationService.getActivities(userId, from, to));
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
            request.getCategory(),
            request.getEndTime(),
            request.getDurationMinutes(),
            request.getMood(),
            request.getXp(),
            request.getNotes()
        );
        return ApiResponse.success(activityApplicationService.updateActivity(command));
    }

    @GetMapping("/analytics")
    public ApiResponse<ActivityAnalyticsResponse> getAnalytics(
        @RequestHeader("X-User-Id") Long userId,
        @RequestParam(defaultValue = "week") String preset,
        @RequestParam(required = false) String customStartKey,
        @RequestParam(required = false) String customEndKey,
        @RequestParam(defaultValue = "false") boolean excludeSleep
    ) {
        return ApiResponse.success(
            activityAnalyticsService.analyze(
                userId,
                preset,
                customStartKey,
                customEndKey,
                excludeSleep,
                LocalDateTime.now()
            )
        );
    }

    @GetMapping("/summary")
    public ApiResponse<ActivitySummaryResponse> getSummary(@RequestHeader("X-User-Id") Long userId) {
        return ApiResponse.success(activitySummaryService.summarize(userId, LocalDateTime.now()));
    }

    /**
     * @deprecated Use {@link #getAnalytics} instead.
     */
    @Deprecated
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
