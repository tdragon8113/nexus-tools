package com.nexus.workspace.controller;

import com.nexus.common.dto.ApiResponse;
import com.nexus.workspace.dto.CheckinResponse;
import com.nexus.workspace.dto.CreateHabitRequest;
import com.nexus.workspace.dto.HabitResponse;
import com.nexus.workspace.dto.UpdateHabitRequest;
import com.nexus.workspace.service.HabitService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/habits")
public class HabitController {

    private final HabitService habitService;

    public HabitController(HabitService habitService) {
        this.habitService = habitService;
    }

    @PostMapping
    public ApiResponse<HabitResponse> createHabit(
        @RequestHeader("X-User-Id") Long userId,
        @Valid @RequestBody CreateHabitRequest request
    ) {
        return ApiResponse.success(habitService.createHabit(userId, request));
    }

    @GetMapping
    public ApiResponse<List<HabitResponse>> getHabits(@RequestHeader("X-User-Id") Long userId) {
        return ApiResponse.success(habitService.getHabits(userId));
    }

    @GetMapping("/{id}")
    public ApiResponse<HabitResponse> getHabit(
        @RequestHeader("X-User-Id") Long userId,
        @PathVariable Long id
    ) {
        return ApiResponse.success(habitService.getHabit(userId, id));
    }

    @PutMapping("/{id}")
    public ApiResponse<HabitResponse> updateHabit(
        @RequestHeader("X-User-Id") Long userId,
        @PathVariable Long id,
        @Valid @RequestBody UpdateHabitRequest request
    ) {
        return ApiResponse.success(habitService.updateHabit(userId, id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteHabit(
        @RequestHeader("X-User-Id") Long userId,
        @PathVariable Long id
    ) {
        habitService.deleteHabit(userId, id);
        return ApiResponse.success();
    }

    @PostMapping("/{id}/checkin")
    public ApiResponse<CheckinResponse> checkin(
        @RequestHeader("X-User-Id") Long userId,
        @PathVariable Long id
    ) {
        return ApiResponse.success(habitService.checkin(userId, id));
    }

    @GetMapping("/{id}/checkins")
    public ApiResponse<List<CheckinResponse>> getCheckins(
        @RequestHeader("X-User-Id") Long userId,
        @PathVariable Long id,
        @RequestParam(required = false) LocalDate startDate,
        @RequestParam(required = false) LocalDate endDate
    ) {
        return ApiResponse.success(habitService.getCheckins(userId, id, startDate, endDate));
    }
}