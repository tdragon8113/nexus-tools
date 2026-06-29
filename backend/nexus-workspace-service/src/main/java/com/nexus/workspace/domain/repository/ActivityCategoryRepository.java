package com.nexus.workspace.domain.repository;

import com.nexus.workspace.domain.model.category.UserActivityCategory;

import java.util.List;

public interface ActivityCategoryRepository {
    List<UserActivityCategory> findByUserId(Long userId);

    UserActivityCategory findByUserIdAndSlug(Long userId, String slug);

    void replaceAll(Long userId, List<UserActivityCategory> categories);

    void save(UserActivityCategory category);

    void delete(Long userId, String slug);
}
