package com.nexus.workspace.interfaces.controller;

import com.nexus.common.dto.ApiResponse;
import com.nexus.workspace.application.command.CheckinCommand;
import com.nexus.workspace.application.command.CreateHabitCommand;
import com.nexus.workspace.application.command.UpdateHabitCommand;
import com.nexus.workspace.application.service.HabitApplicationService;
import com.nexus.workspace.interfaces.dto.request.CreateHabitRequest;
import com.nexus.workspace.interfaces.dto.request.UpdateHabitRequest;
import com.nexus.workspace.interfaces.dto.response.CheckinResponse;
import com.nexus.workspace.interfaces.dto.response.HabitResponse;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * 习惯控制器（接口层）
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/habits")
public class HabitController {

    private final HabitApplicationService habitApplicationService;

    public HabitController(HabitApplicationService habitApplicationService) {
        this.habitApplicationService = habitApplicationService;
    }

    @PostMapping
    public ApiResponse<HabitResponse> createHabit(
        @RequestHeader("X-User-Id") Long userId,
        @Valid @RequestBody CreateHabitRequest request
    ) {
        CreateHabitCommand command = new CreateHabitCommand(
            userId,
            request.getName(),
            request.getIcon(),
            request.getTarget(),
            request.getCustomDays()
        );
        return ApiResponse.success(habitApplicationService.createHabit(command));
    }

    @GetMapping
    public ApiResponse<List<HabitResponse>> getHabits(@RequestHeader("X-User-Id") Long userId) {
        return ApiResponse.success(habitApplicationService.getHabits(userId));
    }

    @GetMapping("/{id}")
    public ApiResponse<HabitResponse> getHabit(
        @RequestHeader("X-User-Id") Long userId,
        @PathVariable Long id
    ) {
        return ApiResponse.success(habitApplicationService.getHabit(userId, id));
    }

    @PutMapping("/{id}")
    public ApiResponse<HabitResponse> updateHabit(
        @RequestHeader("X-User-Id") Long userId,
        @PathVariable Long id,
        @Valid @RequestBody UpdateHabitRequest request
    ) {
        UpdateHabitCommand command = new UpdateHabitCommand(
            userId,
            id,
            request.getName(),
            request.getIcon(),
            request.getTarget(),
            request.getCustomDays()
        );
        return ApiResponse.success(habitApplicationService.updateHabit(command));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteHabit(
        @RequestHeader("X-User-Id") Long userId,
        @PathVariable Long id
    ) {
        habitApplicationService.deleteHabit(userId, id);
        return ApiResponse.success();
    }

    @PostMapping("/{id}/checkin")
    public ApiResponse<CheckinResponse> checkin(
        @RequestHeader("X-User-Id") Long userId,
        @PathVariable Long id
    ) {
        CheckinCommand command = new CheckinCommand(userId, id);
        return ApiResponse.success(habitApplicationService.checkin(command));
    }

    @GetMapping("/{id}/checkins")
    public ApiResponse<List<CheckinResponse>> getCheckins(
        @RequestHeader("X-User-Id") Long userId,
        @PathVariable Long id,
        @RequestParam(required = false) LocalDate startDate,
        @RequestParam(required = false) LocalDate endDate
    ) {
        return ApiResponse.success(habitApplicationService.getCheckins(userId, id, startDate, endDate));
    }
}