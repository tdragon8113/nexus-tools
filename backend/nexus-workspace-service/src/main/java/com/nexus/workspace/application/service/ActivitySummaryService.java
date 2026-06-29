package com.nexus.workspace.application.service;

import com.nexus.workspace.application.support.LevelThresholds;
import com.nexus.workspace.domain.model.activity.Activity;
import com.nexus.workspace.domain.model.category.UserActivityCategory;
import com.nexus.workspace.domain.repository.ActivityCategoryRepository;
import com.nexus.workspace.domain.repository.ActivityRepository;
import com.nexus.workspace.interfaces.dto.response.ActivitySummaryResponse;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static com.nexus.workspace.application.support.StatsDateUtils.getActivityAttributionDateKey;
import static com.nexus.workspace.application.support.StatsDateUtils.getStreakDays;

@Service
public class ActivitySummaryService {

    private final ActivityRepository activityRepository;
    private final ActivityCategoryRepository activityCategoryRepository;

    public ActivitySummaryService(
        ActivityRepository activityRepository,
        ActivityCategoryRepository activityCategoryRepository
    ) {
        this.activityRepository = activityRepository;
        this.activityCategoryRepository = activityCategoryRepository;
    }

    public ActivitySummaryResponse summarize(Long userId, LocalDateTime now) {
        List<Activity> activities = activityRepository.findByUserId(userId);
        List<UserActivityCategory> categories = activityCategoryRepository.findByUserId(userId);

        int totalXp = activities.stream()
            .mapToInt(activity -> activity.getXp() != null ? activity.getXp() : 0)
            .sum();
        LevelThresholds.LevelInfo levelInfo = LevelThresholds.getLevelInfo(totalXp);

        Set<String> recordDays = new HashSet<>();
        for (Activity activity : activities) {
            recordDays.add(getActivityAttributionDateKey(activity, categories));
        }

        ActivitySummaryResponse response = new ActivitySummaryResponse();
        response.setTotalXp(totalXp);
        response.setLevel(levelInfo.level());
        response.setLevelProgress(levelInfo.levelProgress());
        response.setRecordDays(recordDays.size());
        response.setStreak(getStreakDays(activities, categories, now));
        return response;
    }
}
