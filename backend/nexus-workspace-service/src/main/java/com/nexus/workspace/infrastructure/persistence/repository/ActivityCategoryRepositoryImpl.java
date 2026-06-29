package com.nexus.workspace.infrastructure.persistence.repository;

import com.nexus.workspace.domain.model.category.UserActivityCategory;
import com.nexus.workspace.domain.repository.ActivityCategoryRepository;
import com.nexus.workspace.infrastructure.persistence.mapper.ActivityCategoryMapper;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public class ActivityCategoryRepositoryImpl implements ActivityCategoryRepository {

    private final ActivityCategoryMapper activityCategoryMapper;

    public ActivityCategoryRepositoryImpl(ActivityCategoryMapper activityCategoryMapper) {
        this.activityCategoryMapper = activityCategoryMapper;
    }

    @Override
    public List<UserActivityCategory> findByUserId(Long userId) {
        return activityCategoryMapper.findByUserId(userId);
    }

    @Override
    public UserActivityCategory findByUserIdAndSlug(Long userId, String slug) {
        return activityCategoryMapper.findByUserIdAndSlug(userId, slug);
    }

    @Override
    @Transactional
    public void replaceAll(Long userId, List<UserActivityCategory> categories) {
        activityCategoryMapper.deleteByUserId(userId);
        for (UserActivityCategory category : categories) {
            category.setUserId(userId);
            activityCategoryMapper.insertCategory(category);
        }
    }

    @Override
    public void save(UserActivityCategory category) {
        if (category.getId() == null) {
            activityCategoryMapper.insertCategory(category);
        } else {
            activityCategoryMapper.updateCategory(category);
        }
    }

    @Override
    public void delete(Long userId, String slug) {
        activityCategoryMapper.deleteByUserIdAndSlug(userId, slug);
    }
}
