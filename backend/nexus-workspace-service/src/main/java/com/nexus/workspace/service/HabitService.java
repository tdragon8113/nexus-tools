package com.nexus.workspace.service;

import com.nexus.common.exception.BusinessException;
import com.nexus.workspace.dto.CheckinResponse;
import com.nexus.workspace.dto.CreateHabitRequest;
import com.nexus.workspace.dto.HabitResponse;
import com.nexus.workspace.dto.UpdateHabitRequest;
import com.nexus.workspace.entity.Habit;
import com.nexus.workspace.entity.HabitCheckin;
import com.nexus.workspace.mapper.HabitCheckinMapper;
import com.nexus.workspace.mapper.HabitMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class HabitService {

    private final HabitMapper habitMapper;
    private final HabitCheckinMapper checkinMapper;

    public HabitService(HabitMapper habitMapper, HabitCheckinMapper checkinMapper) {
        this.habitMapper = habitMapper;
        this.checkinMapper = checkinMapper;
    }

    @Transactional
    public HabitResponse createHabit(Long userId, CreateHabitRequest request) {
        Habit habit = new Habit();
        habit.setUserId(userId);
        habit.setName(request.getName());
        habit.setIcon(request.getIcon() != null ? request.getIcon() : "star-o");
        habit.setTarget(request.getTarget() != null ? request.getTarget() : "daily");
        habit.setCustomDays(request.getCustomDays());
        habit.setCreatedAt(LocalDateTime.now());

        habitMapper.insert(habit);
        log.info("Habit created: userId={}, habitId={}, name={}", userId, habit.getId(), habit.getName());

        return toResponse(habit);
    }

    public List<HabitResponse> getHabits(Long userId) {
        List<Habit> habits = habitMapper.findByUserId(userId);
        return habits.stream().map(this::toResponse).toList();
    }

    public HabitResponse getHabit(Long userId, Long habitId) {
        Habit habit = habitMapper.findById(habitId);
        if (habit == null || !habit.getUserId().equals(userId)) {
            throw new BusinessException(404, "习惯不存在");
        }
        return toResponse(habit);
    }

    @Transactional
    public HabitResponse updateHabit(Long userId, Long habitId, UpdateHabitRequest request) {
        Habit habit = habitMapper.findById(habitId);
        if (habit == null || !habit.getUserId().equals(userId)) {
            throw new BusinessException(404, "习惯不存在");
        }

        habit.setName(request.getName());
        habit.setIcon(request.getIcon());
        habit.setTarget(request.getTarget());
        habit.setCustomDays(request.getCustomDays());
        habit.setUpdatedAt(LocalDateTime.now());

        habitMapper.update(habit);
        log.info("Habit updated: habitId={}", habitId);

        return toResponse(habit);
    }

    @Transactional
    public void deleteHabit(Long userId, Long habitId) {
        Habit habit = habitMapper.findById(habitId);
        if (habit == null || !habit.getUserId().equals(userId)) {
            throw new BusinessException(404, "习惯不存在");
        }

        habitMapper.deleteById(habitId);
        log.info("Habit deleted: habitId={}", habitId);
    }

    @Transactional
    public CheckinResponse checkin(Long userId, Long habitId) {
        Habit habit = habitMapper.findById(habitId);
        if (habit == null || !habit.getUserId().equals(userId)) {
            throw new BusinessException(404, "习惯不存在");
        }

        LocalDate today = LocalDate.now();
        HabitCheckin existing = checkinMapper.findByHabitIdAndDate(habitId, today);
        if (existing != null) {
            CheckinResponse response = new CheckinResponse();
            response.setId(existing.getId());
            response.setHabitId(habitId);
            response.setCheckinDate(today);
            response.setChecked(true);
            return response;
        }

        HabitCheckin checkin = new HabitCheckin();
        checkin.setHabitId(habitId);
        checkin.setUserId(userId);
        checkin.setCheckinDate(today);
        checkin.setCreatedAt(LocalDateTime.now());

        checkinMapper.insert(checkin);
        log.info("Habit checkin: habitId={}, date={}", habitId, today);

        CheckinResponse response = new CheckinResponse();
        response.setId(checkin.getId());
        response.setHabitId(habitId);
        response.setCheckinDate(today);
        response.setChecked(true);
        return response;
    }

    public List<CheckinResponse> getCheckins(Long userId, Long habitId, LocalDate startDate, LocalDate endDate) {
        Habit habit = habitMapper.findById(habitId);
        if (habit == null || !habit.getUserId().equals(userId)) {
            throw new BusinessException(404, "习惯不存在");
        }

        if (startDate == null) {
            startDate = LocalDate.now().minusDays(30);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }

        List<HabitCheckin> checkins = checkinMapper.findByHabitIdAndDateRange(habitId, startDate, endDate);
        return checkins.stream().map(c -> {
            CheckinResponse r = new CheckinResponse();
            r.setId(c.getId());
            r.setHabitId(c.getHabitId());
            r.setCheckinDate(c.getCheckinDate());
            r.setChecked(true);
            return r;
        }).toList();
    }

    private HabitResponse toResponse(Habit habit) {
        HabitResponse response = new HabitResponse();
        response.setId(habit.getId());
        response.setName(habit.getName());
        response.setIcon(habit.getIcon());
        response.setTarget(habit.getTarget());
        response.setCustomDays(habit.getCustomDays());
        response.setCreatedAt(habit.getCreatedAt());
        response.setUpdatedAt(habit.getUpdatedAt());

        // 计算连续打卡天数
        response.setStreakDays(calculateStreak(habit.getId()));

        // 获取最近30天打卡记录
        LocalDate start = LocalDate.now().minusDays(30);
        LocalDate end = LocalDate.now();
        List<HabitCheckin> checkins = checkinMapper.findByHabitIdAndDateRange(habit.getId(), start, end);
        List<String> dates = checkins.stream()
            .map(c -> c.getCheckinDate().toString())
            .toList();
        response.setRecentCheckins(dates);

        return response;
    }

    private int calculateStreak(Long habitId) {
        List<HabitCheckin> checkins = checkinMapper.findByHabitId(habitId);
        if (checkins.isEmpty()) {
            return 0;
        }

        int streak = 0;
        LocalDate prevDate = null;
        for (HabitCheckin c : checkins) {
            LocalDate date = c.getCheckinDate();
            if (prevDate == null) {
                streak = 1;
            } else if (prevDate.minusDays(1).equals(date)) {
                streak++;
            } else {
                break;
            }
            prevDate = date;
        }
        return streak;
    }
}