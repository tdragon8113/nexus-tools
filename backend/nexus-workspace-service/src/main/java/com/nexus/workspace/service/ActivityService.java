package com.nexus.workspace.service;

import com.nexus.common.exception.BusinessException;
import com.nexus.workspace.dto.ActivityResponse;
import com.nexus.workspace.dto.CreateActivityRequest;
import com.nexus.workspace.dto.StatsResponse;
import com.nexus.workspace.entity.Activity;
import com.nexus.workspace.mapper.ActivityMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class ActivityService {

    private final ActivityMapper activityMapper;

    public ActivityService(ActivityMapper activityMapper) {
        this.activityMapper = activityMapper;
    }

    @Transactional
    public ActivityResponse createActivity(Long userId, CreateActivityRequest request) {
        Activity activity = new Activity();
        activity.setUserId(userId);
        activity.setTitle(request.getTitle());
        activity.setCategory(request.getCategory() != null ? request.getCategory() : "pomodoro-work");
        activity.setStartTime(request.getStartTime());
        activity.setEndTime(request.getEndTime());
        activity.setDurationMinutes(request.getDurationMinutes());
        activity.setNotes(request.getNotes());
        activity.setCreatedAt(LocalDateTime.now());

        activityMapper.insert(activity);
        log.info("Activity created: userId={}, activityId={}, duration={}min",
            userId, activity.getId(), activity.getDurationMinutes());

        return toResponse(activity);
    }

    public List<ActivityResponse> getActivities(Long userId) {
        List<Activity> activities = activityMapper.findByUserId(userId);
        return activities.stream().map(this::toResponse).toList();
    }

    public StatsResponse getStats(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime todayStart = now.truncatedTo(ChronoUnit.DAYS);
        LocalDateTime weekStart = todayStart.minusDays(7);
        LocalDateTime monthStart = todayStart.minusDays(30);

        List<Activity> todayActivities = activityMapper.findByUserIdAndDateRange(userId, todayStart, now);
        List<Activity> weekActivities = activityMapper.findByUserIdAndDateRange(userId, weekStart, now);
        List<Activity> monthActivities = activityMapper.findByUserIdAndDateRange(userId, monthStart, now);
        List<Activity> allActivities = activityMapper.findByUserId(userId);

        StatsResponse stats = new StatsResponse();
        stats.setTodayMinutes(sumMinutes(todayActivities));
        stats.setWeekMinutes(sumMinutes(weekActivities));
        stats.setMonthMinutes(sumMinutes(monthActivities));
        stats.setTotalSessions(allActivities.size());

        // 每小时分布
        Map<String, Integer> hourly = new HashMap<>();
        for (int i = 0; i < 24; i++) {
            hourly.put(String.format("%02d", i), 0);
        }
        for (Activity a : weekActivities) {
            if (a.getStartTime() != null) {
                String hour = String.format("%02d", a.getStartTime().getHour());
                hourly.merge(hour, a.getDurationMinutes() != null ? a.getDurationMinutes() : 0, Integer::sum);
            }
        }
        stats.setHourlyDistribution(hourly);

        // 每日分布
        Map<String, Integer> daily = new HashMap<>();
        for (Activity a : monthActivities) {
            if (a.getStartTime() != null) {
                String day = a.getStartTime().toLocalDate().toString();
                daily.merge(day, a.getDurationMinutes() != null ? a.getDurationMinutes() : 0, Integer::sum);
            }
        }
        stats.setDailyDistribution(daily);

        return stats;
    }

    @Transactional
    public void deleteActivity(Long userId, Long activityId) {
        Activity activity = activityMapper.findById(activityId);
        if (activity == null || !activity.getUserId().equals(userId)) {
            throw new BusinessException(404, "记录不存在");
        }

        activityMapper.deleteById(activityId);
        log.info("Activity deleted: activityId={}", activityId);
    }

    private int sumMinutes(List<Activity> activities) {
        return activities.stream()
            .filter(a -> a.getDurationMinutes() != null)
            .mapToInt(Activity::getDurationMinutes)
            .sum();
    }

    private ActivityResponse toResponse(Activity activity) {
        ActivityResponse response = new ActivityResponse();
        response.setId(activity.getId());
        response.setTitle(activity.getTitle());
        response.setCategory(activity.getCategory());
        response.setStartTime(activity.getStartTime());
        response.setEndTime(activity.getEndTime());
        response.setDurationMinutes(activity.getDurationMinutes());
        response.setNotes(activity.getNotes());
        response.setCreatedAt(activity.getCreatedAt());
        return response;
    }
}