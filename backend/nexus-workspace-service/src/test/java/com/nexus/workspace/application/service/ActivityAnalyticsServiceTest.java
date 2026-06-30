package com.nexus.workspace.application.service;

import com.nexus.workspace.application.support.ActivityCategoryDefaults;
import com.nexus.workspace.domain.model.activity.Activity;
import com.nexus.workspace.domain.model.category.UserActivityCategory;
import com.nexus.workspace.domain.repository.ActivityCategoryRepository;
import com.nexus.workspace.domain.repository.ActivityRepository;
import com.nexus.workspace.interfaces.dto.response.ActivityAnalyticsResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ActivityAnalyticsServiceTest {

    private static final Long USER_ID = 1L;

    @Mock
    private ActivityRepository activityRepository;

    @Mock
    private ActivityCategoryRepository activityCategoryRepository;

    private ActivityAnalyticsService service;
    private List<UserActivityCategory> categories;

    @BeforeEach
    void setUp() {
        service = new ActivityAnalyticsService(activityRepository, activityCategoryRepository);
        categories = ActivityCategoryDefaults.buildEntities(USER_ID);
        when(activityCategoryRepository.findByUserId(USER_ID)).thenReturn(categories);
    }

    @Test
    void weekPreset_excludesSleep_filtersSleepCategory() {
        LocalDateTime now = LocalDateTime.of(2026, 6, 26, 12, 0);
        List<Activity> activities = List.of(
            activity("work", 60, LocalDateTime.of(2026, 6, 25, 9, 0)),
            activity("sleep", 480, LocalDateTime.of(2026, 6, 25, 23, 0))
        );
        when(activityRepository.findByUserId(USER_ID)).thenReturn(activities);

        ActivityAnalyticsResponse response = service.analyze(USER_ID, "week", null, null, true, now);

        assertThat(response.getMetrics().getTotalMinutes()).isEqualTo(60);
    }

    @Test
    void metrics_exposeChangePercentComparedToPreviousPeriod() {
        LocalDateTime now = LocalDateTime.of(2026, 6, 26, 12, 0);
        List<Activity> activities = List.of(
            activity("work", 120, LocalDateTime.of(2026, 6, 25, 10, 0)),
            activity("work", 60, LocalDateTime.of(2026, 6, 18, 10, 0))
        );
        when(activityRepository.findByUserId(USER_ID)).thenReturn(activities);

        ActivityAnalyticsResponse response = service.analyze(USER_ID, "week", null, null, false, now);

        assertThat(response.getMetrics().getTotalMinutes()).isEqualTo(120);
        assertThat(response.getPreviousMetrics().getTotalMinutes()).isEqualTo(60);
        assertThat(response.getTotalChange()).isEqualTo(100);
    }

    @Test
    void streakCountsConsecutiveDaysWithRecords() {
        LocalDateTime now = LocalDateTime.of(2026, 6, 26, 12, 0);
        List<Activity> activities = List.of(
            activity("work", 30, LocalDateTime.of(2026, 6, 26, 9, 0)),
            activity("work", 30, LocalDateTime.of(2026, 6, 25, 9, 0)),
            activity("work", 30, LocalDateTime.of(2026, 6, 24, 9, 0)),
            activity("work", 30, LocalDateTime.of(2026, 6, 22, 9, 0))
        );
        when(activityRepository.findByUserId(USER_ID)).thenReturn(activities);

        ActivityAnalyticsResponse response = service.analyze(USER_ID, "week", null, null, false, now);

        assertThat(response.getStreak()).isEqualTo(3);
    }

    @Test
    void customPreset_usesProvidedDateRange() {
        LocalDateTime now = LocalDateTime.of(2026, 6, 26, 12, 0);
        List<Activity> activities = List.of(
            activity("work", 45, LocalDateTime.of(2026, 6, 5, 10, 0)),
            activity("work", 90, LocalDateTime.of(2026, 6, 15, 10, 0))
        );
        when(activityRepository.findByUserId(USER_ID)).thenReturn(activities);

        ActivityAnalyticsResponse response = service.analyze(
            USER_ID,
            "custom",
            "2026-06-01",
            "2026-06-10",
            false,
            now
        );

        assertThat(response.getBounds().getStartKey()).isEqualTo("2026-06-01");
        assertThat(response.getBounds().getEndKey()).isEqualTo("2026-06-10");
        assertThat(response.getBounds().getDayCount()).isEqualTo(10);
        assertThat(response.getMetrics().getTotalMinutes()).isEqualTo(45);
        assertThat(response.getRangeLabel()).isEqualTo("6/1 – 6/10");
    }

    @Test
    void calcStatsChangePercent_returnsNullWhenBothPeriodsAreZero() {
        LocalDateTime now = LocalDateTime.of(2026, 6, 26, 12, 0);
        when(activityRepository.findByUserId(USER_ID)).thenReturn(List.of());

        ActivityAnalyticsResponse response = service.analyze(USER_ID, "today", null, null, false, now);

        assertThat(response.getTotalChange()).isNull();
        assertThat(response.getAvgChange()).isNull();
        assertThat(response.getXpChange()).isNull();
    }

    @Test
    void todayPreset_countsOngoingActivityDurationFromStartToNow() {
        LocalDateTime now = LocalDateTime.of(2026, 6, 30, 17, 0);
        Activity ongoing = new Activity();
        ongoing.setUserId(USER_ID);
        ongoing.setCategory("study");
        ongoing.setTitle("开发");
        ongoing.setStartTime(LocalDateTime.of(2026, 6, 30, 16, 42));
        ongoing.setEndTime(null);
        ongoing.setDurationMinutes(0);
        ongoing.setMood(3);
        ongoing.setXp(0);
        when(activityRepository.findByUserId(USER_ID)).thenReturn(List.of(ongoing));

        ActivityAnalyticsResponse response = service.analyze(USER_ID, "today", null, null, false, now);

        assertThat(response.getMetrics().getTotalMinutes()).isEqualTo(18);
        assertThat(response.getMetrics().getActivityCount()).isEqualTo(1);
        assertThat(response.getCategoryBreakdown()).hasSize(1);
        assertThat(response.getCategoryBreakdown().getFirst().getMinutes()).isEqualTo(18);
    }

    private Activity activity(String category, int durationMinutes, LocalDateTime startTime) {
        Activity activity = new Activity();
        activity.setUserId(USER_ID);
        activity.setCategory(category);
        activity.setTitle(category);
        activity.setDurationMinutes(durationMinutes);
        activity.setStartTime(startTime);
        activity.setEndTime(startTime.plusMinutes(durationMinutes));
        activity.setMood(3);
        activity.setXp(10);
        return activity;
    }
}
