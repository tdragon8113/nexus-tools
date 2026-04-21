package com.nexus.workspace.infrastructure.repository;

import com.nexus.workspace.domain.model.habit.Habit;
import com.nexus.workspace.domain.model.habit.HabitCheckin;
import com.nexus.workspace.domain.model.habit.HabitId;
import com.nexus.workspace.domain.repository.HabitRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * 习惯仓储实现（基础设施层）
 */
@Slf4j
@Repository
public class HabitRepositoryImpl implements HabitRepository {

    private final HabitMapper habitMapper;
    private final HabitCheckinMapper checkinMapper;

    public HabitRepositoryImpl(HabitMapper habitMapper, HabitCheckinMapper checkinMapper) {
        this.habitMapper = habitMapper;
        this.checkinMapper = checkinMapper;
    }

    @Override
    public Habit findById(HabitId id) {
        Habit habit = habitMapper.selectById(id.value());
        if (habit != null) {
            // 加载打卡记录（聚合内部）
            List<HabitCheckin> checkins = checkinMapper.findByHabitId(id.value());
            habit.setCheckins(checkins);
        }
        return habit;
    }

    @Override
    public List<Habit> findByUserId(Long userId) {
        List<Habit> habits = habitMapper.findByUserId(userId);
        // 批量加载打卡记录
        for (Habit habit : habits) {
            List<HabitCheckin> checkins = checkinMapper.findByHabitId(habit.getIdValue());
            habit.setCheckins(checkins);
        }
        return habits;
    }

    @Override
    public void save(Habit habit) {
        if (habit.getIdValue() == null) {
            habitMapper.insert(habit);
        } else {
            habitMapper.updateById(habit);
        }
    }

    @Override
    public void delete(HabitId id) {
        habitMapper.deleteById(id.value());
    }

    @Override
    public List<HabitCheckin> findCheckinsByHabitId(HabitId habitId) {
        return checkinMapper.findByHabitId(habitId.value());
    }

    @Override
    public List<HabitCheckin> findCheckinsByHabitIdAndDateRange(HabitId habitId, LocalDate startDate, LocalDate endDate) {
        return checkinMapper.findByHabitIdAndDateRange(habitId.value(), startDate, endDate);
    }

    @Override
    public HabitCheckin findCheckinByHabitIdAndDate(HabitId habitId, LocalDate date) {
        return checkinMapper.findByHabitIdAndDate(habitId.value(), date);
    }

    @Override
    public void saveCheckin(HabitCheckin checkin) {
        checkinMapper.insert(checkin);
    }
}