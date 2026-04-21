package com.nexus.workspace.domain.service;

import com.nexus.workspace.domain.model.habit.HabitCheckin;

import java.time.LocalDate;
import java.util.List;

/**
 * 连续打卡计算领域服务
 */
public class StreakCalculator {

    /**
     * 计算连续打卡天数
     */
    public int calculate(List<HabitCheckin> checkins) {
        if (checkins == null || checkins.isEmpty()) return 0;

        List<LocalDate> sortedDates = checkins.stream()
            .map(HabitCheckin::getCheckinDate)
            .sorted(LocalDate::compareTo)
            .toList();

        int streak = 0;
        LocalDate prevDate = null;

        // 从最近的日期往前计算
        for (int i = sortedDates.size() - 1; i >= 0; i--) {
            LocalDate date = sortedDates.get(i);
            if (prevDate == null) {
                // 从今天开始
                if (date.equals(LocalDate.now()) || date.equals(LocalDate.now().minusDays(1))) {
                    streak = 1;
                } else {
                    break;
                }
            } else if (prevDate.minusDays(1).equals(date)) {
                streak++;
            } else {
                break;
            }
            prevDate = date;
        }

        return streak;
    }

    /**
     * 计算指定时间段内的打卡天数
     */
    public int countCheckins(List<HabitCheckin> checkins, LocalDate start, LocalDate end) {
        if (checkins == null) return 0;

        return (int) checkins.stream()
            .filter(c -> !c.getCheckinDate().isBefore(start) && !c.getCheckinDate().isAfter(end))
            .count();
    }
}