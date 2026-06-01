package com.nexus.workspace.application.service;

import com.nexus.common.support.ResourceAccessChecker;
import com.nexus.workspace.application.command.CheckinCommand;
import com.nexus.workspace.application.command.CreateHabitCommand;
import com.nexus.workspace.application.command.UpdateHabitCommand;
import com.nexus.workspace.domain.event.HabitCheckedInEvent;
import com.nexus.workspace.domain.model.habit.Habit;
import com.nexus.workspace.domain.model.habit.HabitCheckin;
import com.nexus.workspace.domain.model.habit.HabitId;
import com.nexus.workspace.domain.model.habit.TargetType;
import com.nexus.workspace.domain.repository.HabitRepository;
import com.nexus.workspace.interfaces.dto.response.CheckinResponse;
import com.nexus.workspace.interfaces.dto.response.HabitResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * 习惯应用服务（编排）
 */
@Slf4j
@Service
public class HabitApplicationService {

    private final HabitRepository habitRepository;

    public HabitApplicationService(HabitRepository habitRepository) {
        this.habitRepository = habitRepository;
    }

    @Transactional
    public HabitResponse createHabit(CreateHabitCommand command) {
        TargetType target = TargetType.fromString(command.target());
        Habit habit = Habit.create(
            command.userId(),
            command.name(),
            command.icon(),
            target,
            command.customDays()
        );
        habitRepository.save(habit);
        log.info("Habit created: userId={}, name={}", command.userId(), command.name());
        return toResponse(habit);
    }

    public List<HabitResponse> getHabits(Long userId) {
        List<Habit> habits = habitRepository.findByUserId(userId);
        return habits.stream().map(this::toResponse).toList();
    }

    public HabitResponse getHabit(Long userId, Long habitId) {
        Habit habit = requireHabit(habitId, userId);
        return toResponse(habit);
    }

    @Transactional
    public HabitResponse updateHabit(UpdateHabitCommand command) {
        Habit habit = requireHabit(command.habitId(), command.userId());

        TargetType target = TargetType.fromString(command.target());
        habit.update(command.name(), command.icon(), target, command.customDays());
        habitRepository.save(habit);
        log.info("Habit updated: habitId={}", command.habitId());
        return toResponse(habit);
    }

    @Transactional
    public void deleteHabit(Long userId, Long habitId) {
        requireHabit(habitId, userId);
        habitRepository.delete(new HabitId(habitId));
        log.info("Habit deleted: habitId={}", habitId);
    }

    @Transactional
    public CheckinResponse checkin(CheckinCommand command) {
        HabitId habitId = new HabitId(command.habitId());
        Habit habit = requireHabit(command.habitId(), command.userId());

        HabitCheckin checkin = habit.checkin(command.date());
        habitRepository.saveCheckin(checkin);

        // 发布领域事件（可用于后续扩展）
        HabitCheckedInEvent event = new HabitCheckedInEvent(habitId, command.userId(), command.date());
        log.info("Habit checked in: habitId={}, date={}", command.habitId(), command.date());

        CheckinResponse response = new CheckinResponse();
        response.setId(checkin.getId());
        response.setHabitId(command.habitId());
        response.setCheckinDate(command.date());
        response.setChecked(true);
        return response;
    }

    public List<CheckinResponse> getCheckins(Long userId, Long habitId, LocalDate startDate, LocalDate endDate) {
        requireHabit(habitId, userId);

        if (startDate == null) startDate = LocalDate.now().minusDays(30);
        if (endDate == null) endDate = LocalDate.now();

        List<HabitCheckin> checkins = habitRepository.findCheckinsByHabitIdAndDateRange(
            new HabitId(habitId), startDate, endDate
        );
        return checkins.stream().map(c -> {
            CheckinResponse r = new CheckinResponse();
            r.setId(c.getId());
            r.setHabitId(habitId);
            r.setCheckinDate(c.getCheckinDate());
            r.setChecked(true);
            return r;
        }).toList();
    }

    private Habit requireHabit(Long habitId, Long userId) {
        return ResourceAccessChecker.requireOwned(
            habitRepository.findById(new HabitId(habitId)),
            h -> h.belongsTo(userId),
            "习惯"
        );
    }

    private HabitResponse toResponse(Habit habit) {
        HabitResponse response = new HabitResponse();
        response.setId(habit.getIdValue());
        response.setName(habit.getName());
        response.setIcon(habit.getIcon());
        response.setTarget(habit.getTarget().toDbValue());
        response.setCustomDays(habit.getCustomDays());
        response.setCreatedAt(habit.getCreatedAt());
        response.setUpdatedAt(habit.getUpdatedAt());

        // 计算连续打卡天数
        List<HabitCheckin> checkins = habitRepository.findCheckinsByHabitId(habit.getId());
        habit.setCheckins(checkins);
        response.setStreakDays(habit.calculateStreak());

        // 获取最近30天打卡记录
        LocalDate start = LocalDate.now().minusDays(30);
        LocalDate end = LocalDate.now();
        List<HabitCheckin> recentCheckins = habitRepository.findCheckinsByHabitIdAndDateRange(habit.getId(), start, end);
        List<String> dates = recentCheckins.stream()
            .map(c -> c.getCheckinDate().toString())
            .toList();
        response.setRecentCheckins(dates);

        return response;
    }
}