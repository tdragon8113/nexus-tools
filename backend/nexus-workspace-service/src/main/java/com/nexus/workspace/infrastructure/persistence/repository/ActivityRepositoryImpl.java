package com.nexus.workspace.infrastructure.persistence.repository;

import com.nexus.workspace.domain.model.activity.Activity;
import com.nexus.workspace.domain.repository.ActivityRepository;
import com.nexus.workspace.infrastructure.persistence.mapper.ActivityMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Activity 仓储实现（持久化层）
 */
@Slf4j
@Repository
public class ActivityRepositoryImpl implements ActivityRepository {

    private final ActivityMapper activityMapper;

    public ActivityRepositoryImpl(ActivityMapper activityMapper) {
        this.activityMapper = activityMapper;
    }

    @Override
    public Activity findById(Long id) {
        return activityMapper.selectById(id);
    }

    @Override
    public List<Activity> findByUserId(Long userId) {
        return activityMapper.findByUserId(userId);
    }

    @Override
    public List<Activity> findByUserIdAndDateRange(Long userId, LocalDateTime startTime, LocalDateTime endTime) {
        return activityMapper.findByUserIdAndDateRange(userId, startTime, endTime);
    }

    @Override
    public void save(Activity activity) {
        if (activity.getId() == null) {
            activityMapper.insert(activity);
        } else {
            activityMapper.updateById(activity);
        }
    }

    @Override
    public void delete(Long id) {
        activityMapper.deleteById(id);
    }
}