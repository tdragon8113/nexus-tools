package com.nexus.workspace.domain.repository;

import com.nexus.workspace.domain.model.habit.Habit;
import com.nexus.workspace.domain.model.habit.HabitId;
import com.nexus.workspace.domain.model.habit.HabitCheckin;

import java.time.LocalDate;
import java.util.List;

/**
 * 习惯仓储接口
 */
public interface HabitRepository {
    Habit findById(HabitId id);
    List<Habit> findByUserId(Long userId);
    void save(Habit habit);
    void delete(HabitId id);

    // 打卡记录相关
    List<HabitCheckin> findCheckinsByHabitId(HabitId habitId);
    List<HabitCheckin> findCheckinsByHabitIdAndDateRange(HabitId habitId, LocalDate startDate, LocalDate endDate);
    HabitCheckin findCheckinByHabitIdAndDate(HabitId habitId, LocalDate date);
    void saveCheckin(HabitCheckin checkin);
}