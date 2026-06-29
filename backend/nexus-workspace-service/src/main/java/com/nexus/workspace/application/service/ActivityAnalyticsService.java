package com.nexus.workspace.application.service;

import com.nexus.workspace.application.support.StatsDateUtils;
import com.nexus.workspace.domain.model.activity.Activity;
import com.nexus.workspace.domain.model.category.UserActivityCategory;
import com.nexus.workspace.domain.repository.ActivityCategoryRepository;
import com.nexus.workspace.domain.repository.ActivityRepository;
import com.nexus.workspace.interfaces.dto.response.ActivityAnalyticsResponse;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

import static com.nexus.workspace.application.support.StatsDateUtils.buildStatsInsight;
import static com.nexus.workspace.application.support.StatsDateUtils.calcStatsChangePercent;
import static com.nexus.workspace.application.support.StatsDateUtils.filterActivitiesForStats;
import static com.nexus.workspace.application.support.StatsDateUtils.formatStatsRangeLabel;
import static com.nexus.workspace.application.support.StatsDateUtils.getPeriodCategoryBreakdown;
import static com.nexus.workspace.application.support.StatsDateUtils.getPeriodChartBuckets;
import static com.nexus.workspace.application.support.StatsDateUtils.getPeriodDayMarkers;
import static com.nexus.workspace.application.support.StatsDateUtils.getPeriodMetrics;
import static com.nexus.workspace.application.support.StatsDateUtils.getStatsRangeBounds;
import static com.nexus.workspace.application.support.StatsDateUtils.getStreakDays;
import static com.nexus.workspace.application.support.StatsDateUtils.resolveMoodLabel;

@Service
public class ActivityAnalyticsService {

    private final ActivityRepository activityRepository;
    private final ActivityCategoryRepository activityCategoryRepository;

    public ActivityAnalyticsService(
        ActivityRepository activityRepository,
        ActivityCategoryRepository activityCategoryRepository
    ) {
        this.activityRepository = activityRepository;
        this.activityCategoryRepository = activityCategoryRepository;
    }

    public ActivityAnalyticsResponse analyze(
        Long userId,
        String preset,
        String customStartKey,
        String customEndKey,
        boolean excludeSleep,
        LocalDateTime now
    ) {
        List<Activity> activities = activityRepository.findByUserId(userId);
        List<UserActivityCategory> categories = activityCategoryRepository.findByUserId(userId);
        List<Activity> filteredActivities = filterActivitiesForStats(activities, excludeSleep);

        ActivityAnalyticsResponse.StatsBounds bounds = getStatsRangeBounds(
            preset,
            customStartKey,
            customEndKey,
            now
        );
        ActivityAnalyticsResponse.StatsMetrics metrics = getPeriodMetrics(
            filteredActivities,
            categories,
            bounds.getStartKey(),
            bounds.getEndKey()
        );
        ActivityAnalyticsResponse.StatsMetrics previousMetrics = getPeriodMetrics(
            filteredActivities,
            categories,
            bounds.getPreviousStartKey(),
            bounds.getPreviousEndKey()
        );
        List<ActivityAnalyticsResponse.StatsCategoryBreakdown> categoryBreakdown = getPeriodCategoryBreakdown(
            filteredActivities,
            categories,
            bounds.getStartKey(),
            bounds.getEndKey(),
            bounds.getPreviousStartKey(),
            bounds.getPreviousEndKey()
        );
        List<ActivityAnalyticsResponse.StatsChartBucket> chartBuckets = getPeriodChartBuckets(
            filteredActivities,
            categories,
            bounds
        );
        List<ActivityAnalyticsResponse.StatsDayMarker> dayMarkers = getPeriodDayMarkers(
            filteredActivities,
            categories,
            bounds.getStartKey(),
            bounds.getEndKey()
        );

        ActivityAnalyticsResponse response = new ActivityAnalyticsResponse();
        response.setBounds(bounds);
        response.setMetrics(metrics);
        response.setPreviousMetrics(previousMetrics);
        response.setTotalChange(calcStatsChangePercent(metrics.getTotalMinutes(), previousMetrics.getTotalMinutes()));
        response.setAvgChange(
            calcStatsChangePercent(metrics.getAvgDailyMinutes(), previousMetrics.getAvgDailyMinutes())
        );
        response.setXpChange(calcStatsChangePercent(metrics.getTotalXp(), previousMetrics.getTotalXp()));
        response.setCategoryBreakdown(categoryBreakdown);
        response.setChartBuckets(chartBuckets);
        response.setDayMarkers(dayMarkers);
        response.setStreak(getStreakDays(filteredActivities, categories, now));
        response.setInsight(
            buildStatsInsight(bounds, metrics, previousMetrics, categoryBreakdown, chartBuckets, categories)
        );
        response.setMoodLabel(resolveMoodLabel(metrics.getAvgMood()));
        response.setRangeLabel(formatStatsRangeLabel(bounds.getStartKey(), bounds.getEndKey()));
        return response;
    }
}
