package com.nexus.workspace.domain.repository;

import com.nexus.workspace.domain.model.activity.Activity;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Activity 仓储接口
 */
public interface ActivityRepository {
    Activity findById(Long id);
    List<Activity> findByUserId(Long userId);
    List<Activity> findByUserIdAndDateRange(Long userId, LocalDateTime startTime, LocalDateTime endTime);
    void save(Activity activity);
    void delete(Long id);
}