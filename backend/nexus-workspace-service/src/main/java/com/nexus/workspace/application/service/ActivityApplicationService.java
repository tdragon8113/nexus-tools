package com.nexus.workspace.application.service;

import com.nexus.common.exception.BusinessException;
import com.nexus.common.support.ResourceAccessChecker;
import com.nexus.workspace.application.command.CreateActivityCommand;
import com.nexus.workspace.application.command.UpdateActivityCommand;
import com.nexus.workspace.domain.model.activity.Activity;
import com.nexus.workspace.domain.model.activity.ActivityCategory;
import com.nexus.workspace.domain.repository.ActivityRepository;
import com.nexus.workspace.interfaces.dto.response.ActivityResponse;
import com.nexus.workspace.interfaces.dto.response.StatsResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Activity 应用服务
 */
@Slf4j
@Service
public class ActivityApplicationService {

    private final ActivityRepository activityRepository;

    public ActivityApplicationService(ActivityRepository activityRepository) {
        this.activityRepository = activityRepository;
    }

    @Transactional
    public ActivityResponse createActivity(CreateActivityCommand command) {
        Activity ongoing = activityRepository.findOngoingByUserId(command.userId());
        if (ongoing != null) {
            throw new BusinessException(409, "已有进行中的记录，请先结束后再开始新的");
        }

        Activity activity = Activity.create(
            command.userId(),
            command.title(),
            command.category(),
            command.startTime(),
            command.endTime(),
            command.durationMinutes(),
            command.notes()
        );
        activityRepository.save(activity);
        log.info("Activity created: userId={}, id={}, ongoing={}",
            command.userId(), activity.getId(), command.endTime() == null);
        return toResponse(activity);
    }

    @Transactional
    public ActivityResponse updateActivity(UpdateActivityCommand command) {
        Activity activity = ResourceAccessChecker.requireOwned(
            activityRepository.findById(command.activityId()),
            a -> a.belongsTo(command.userId()),
            "记录"
        );

        if (command.title() != null && !command.title().isBlank()) {
            activity.setTitle(command.title());
        }
        if (command.endTime() != null) {
            activity.setEndTime(command.endTime());
        }
        if (command.durationMinutes() != null) {
            activity.setDurationMinutes(command.durationMinutes());
        } else if (activity.getEndTime() != null && activity.getStartTime() != null) {
            activity.setDurationMinutes(activity.calculateDuration());
        }
        if (command.notes() != null) {
            activity.setNotes(command.notes());
        }

        activityRepository.save(activity);
        log.info("Activity updated: id={}, userId={}", activity.getId(), command.userId());
        return toResponse(activity);
    }

    public ActivityResponse getOngoingActivity(Long userId) {
        Activity activity = activityRepository.findOngoingByUserId(userId);
        return activity != null ? toResponse(activity) : null;
    }

    public List<ActivityResponse> getActivities(Long userId) {
        List<Activity> activities = activityRepository.findByUserId(userId);
        return activities.stream().map(this::toResponse).toList();
    }

    public StatsResponse getStats(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime todayStart = now.truncatedTo(ChronoUnit.DAYS);
        LocalDateTime weekStart = todayStart.minusDays(7);
        LocalDateTime monthStart = todayStart.minusDays(30);

        List<Activity> todayActivities = activityRepository.findByUserIdAndDateRange(userId, todayStart, now);
        List<Activity> weekActivities = activityRepository.findByUserIdAndDateRange(userId, weekStart, now);
        List<Activity> monthActivities = activityRepository.findByUserIdAndDateRange(userId, monthStart, now);
        List<Activity> allActivities = activityRepository.findByUserId(userId);

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
        ResourceAccessChecker.requireOwned(
            activityRepository.findById(activityId),
            a -> a.belongsTo(userId),
            "记录"
        );
        activityRepository.delete(activityId);
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
        response.setCategory(activity.getCategoryCode());
        response.setStartTime(activity.getStartTime());
        response.setEndTime(activity.getEndTime());
        response.setDurationMinutes(activity.getDurationMinutes());
        response.setNotes(activity.getNotes());
        response.setCreatedAt(activity.getCreatedAt());
        return response;
    }
}