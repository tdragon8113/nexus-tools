package com.nexus.workspace.application.service;

import com.nexus.common.exception.BusinessException;
import com.nexus.workspace.application.support.ActivityCategoryDefaults;
import com.nexus.workspace.domain.model.category.UserActivityCategory;
import com.nexus.workspace.domain.repository.ActivityCategoryRepository;
import com.nexus.workspace.domain.repository.ActivityRepository;
import com.nexus.workspace.interfaces.dto.request.SaveActivityCategoryRequest;
import com.nexus.workspace.interfaces.dto.response.ActivityCategoryResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.regex.Pattern;

@Slf4j
@Service
public class ActivityCategoryApplicationService {

    private static final Pattern SLUG_PATTERN = Pattern.compile("^[a-z0-9_-]{1,64}$");

    private final ActivityCategoryRepository categoryRepository;
    private final ActivityRepository activityRepository;

    public ActivityCategoryApplicationService(
        ActivityCategoryRepository categoryRepository,
        ActivityRepository activityRepository
    ) {
        this.categoryRepository = categoryRepository;
        this.activityRepository = activityRepository;
    }

    @Transactional
    public List<ActivityCategoryResponse> getCategories(Long userId) {
        List<UserActivityCategory> categories = categoryRepository.findByUserId(userId);
        if (categories.isEmpty()) {
            return seedDefaults(userId);
        }
        return categories.stream().map(this::toResponse).toList();
    }

    @Transactional
    public ActivityCategoryResponse addCategory(Long userId, SaveActivityCategoryRequest request) {
        validateSlug(request.getId());
        if (categoryRepository.findByUserIdAndSlug(userId, request.getId()) != null) {
            throw new BusinessException(409, "该活动类型已存在");
        }
        UserActivityCategory category = toEntity(userId, request);
        category.setSortOrder(resolveSortOrder(userId, request.getSortOrder()));
        categoryRepository.save(category);
        log.info("Activity category added: userId={}, slug={}", userId, category.getSlug());
        return toResponse(category);
    }

    @Transactional
    public ActivityCategoryResponse updateCategory(Long userId, String slug, SaveActivityCategoryRequest request) {
        UserActivityCategory existing = categoryRepository.findByUserIdAndSlug(userId, slug);
        if (existing == null) {
            throw new BusinessException(404, "活动类型不存在");
        }
        existing.setLabel(request.getLabel());
        existing.setEmoji(request.getEmoji());
        existing.setXpPerHour(request.getXpPerHour());
        if (request.getSortOrder() != null) {
            existing.setSortOrder(request.getSortOrder());
        }
        categoryRepository.save(existing);
        log.info("Activity category updated: userId={}, slug={}", userId, slug);
        return toResponse(existing);
    }

    @Transactional
    public void deleteCategory(Long userId, String slug) {
        List<UserActivityCategory> all = categoryRepository.findByUserId(userId);
        if (all.size() <= 1) {
            throw new BusinessException(400, "至少保留一个活动类型");
        }
        if (activityRepository.countByUserIdAndCategory(userId, slug) > 0) {
            throw new BusinessException(400, "该类型已有记录，无法删除");
        }
        categoryRepository.delete(userId, slug);
        log.info("Activity category deleted: userId={}, slug={}", userId, slug);
    }

    @Transactional
    public List<ActivityCategoryResponse> resetCategories(Long userId) {
        List<UserActivityCategory> defaults = ActivityCategoryDefaults.buildEntities(userId);
        categoryRepository.replaceAll(userId, defaults);
        log.info("Activity categories reset: userId={}", userId);
        return defaults.stream().map(this::toResponse).toList();
    }

    private List<ActivityCategoryResponse> seedDefaults(Long userId) {
        List<UserActivityCategory> defaults = ActivityCategoryDefaults.buildEntities(userId);
        categoryRepository.replaceAll(userId, defaults);
        log.info("Activity categories seeded: userId={}", userId);
        return defaults.stream().map(this::toResponse).toList();
    }

    private int resolveSortOrder(Long userId, Integer requested) {
        if (requested != null) {
            return requested;
        }
        return categoryRepository.findByUserId(userId).size();
    }

    private void validateSlug(String slug) {
        if (slug == null || slug.isBlank()) {
            throw new BusinessException(400, "类型标识不能为空");
        }
        if (!SLUG_PATTERN.matcher(slug).matches()) {
            throw new BusinessException(400, "类型标识仅支持小写字母、数字、下划线和连字符");
        }
    }

    private UserActivityCategory toEntity(Long userId, SaveActivityCategoryRequest request) {
        UserActivityCategory category = new UserActivityCategory();
        category.setUserId(userId);
        category.setSlug(request.getId());
        category.setLabel(request.getLabel());
        category.setEmoji(request.getEmoji());
        category.setXpPerHour(request.getXpPerHour());
        category.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        return category;
    }

    private ActivityCategoryResponse toResponse(UserActivityCategory category) {
        ActivityCategoryResponse response = new ActivityCategoryResponse();
        response.setId(category.getSlug());
        response.setLabel(category.getLabel());
        response.setEmoji(category.getEmoji());
        response.setXpPerHour(category.getXpPerHour());
        response.setSortOrder(category.getSortOrder());
        return response;
    }
}
