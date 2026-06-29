package com.nexus.workspace.application.service;

import com.nexus.workspace.application.support.ActivityCategoryDefaults;
import com.nexus.workspace.application.support.LevelThresholds;
import com.nexus.workspace.domain.model.activity.Activity;
import com.nexus.workspace.domain.model.category.UserActivityCategory;
import com.nexus.workspace.domain.repository.ActivityCategoryRepository;
import com.nexus.workspace.domain.repository.ActivityRepository;
import com.nexus.workspace.interfaces.dto.response.ActivitySummaryResponse;
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
class ActivitySummaryServiceTest {

    private static final Long USER_ID = 1L;

    @Mock
    private ActivityRepository activityRepository;

    @Mock
    private ActivityCategoryRepository activityCategoryRepository;

    private ActivitySummaryService service;

    @BeforeEach
    void setUp() {
        service = new ActivitySummaryService(activityRepository, activityCategoryRepository);
    }

    @Test
    void levelCalculation_atThresholds() {
        assertThat(LevelThresholds.getLevelInfo(0).level()).isEqualTo(1);
        assertThat(LevelThresholds.getLevelInfo(79).level()).isEqualTo(1);
        assertThat(LevelThresholds.getLevelInfo(80).level()).isEqualTo(2);
        assertThat(LevelThresholds.getLevelInfo(2000).level()).isEqualTo(10);
    }

    @Test
    void levelProgress_withinLevel() {
        LevelThresholds.LevelInfo info = LevelThresholds.getLevelInfo(100);
        assertThat(info.level()).isEqualTo(2);
        assertThat(info.levelProgress()).isCloseTo(0.2, org.assertj.core.data.Offset.offset(0.001));
    }

    @Test
    void summarize_aggregatesXpRecordDaysAndStreak() {
        LocalDateTime now = LocalDateTime.of(2026, 6, 26, 12, 0);
        List<UserActivityCategory> categories = ActivityCategoryDefaults.buildEntities(USER_ID);
        when(activityCategoryRepository.findByUserId(USER_ID)).thenReturn(categories);
        List<Activity> activities = List.of(
            activity(50, LocalDateTime.of(2026, 6, 26, 9, 0)),
            activity(30, LocalDateTime.of(2026, 6, 25, 9, 0)),
            activity(20, LocalDateTime.of(2026, 6, 24, 9, 0))
        );
        when(activityRepository.findByUserId(USER_ID)).thenReturn(activities);

        ActivitySummaryResponse response = service.summarize(USER_ID, now);

        assertThat(response.getTotalXp()).isEqualTo(100);
        assertThat(response.getLevel()).isEqualTo(2);
        assertThat(response.getLevelProgress()).isCloseTo(0.2, org.assertj.core.data.Offset.offset(0.001));
        assertThat(response.getRecordDays()).isEqualTo(3);
        assertThat(response.getStreak()).isEqualTo(3);
    }

    private Activity activity(int xp, LocalDateTime startTime) {
        Activity activity = new Activity();
        activity.setUserId(USER_ID);
        activity.setCategory("work");
        activity.setTitle("work");
        activity.setDurationMinutes(30);
        activity.setStartTime(startTime);
        activity.setEndTime(startTime.plusMinutes(30));
        activity.setXp(xp);
        return activity;
    }
}
