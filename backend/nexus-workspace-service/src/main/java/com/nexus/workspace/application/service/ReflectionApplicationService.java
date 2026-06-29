package com.nexus.workspace.application.service;

import com.nexus.common.exception.BusinessException;
import com.nexus.workspace.domain.model.reflection.ReflectionScope;
import com.nexus.workspace.domain.model.reflection.UserReflection;
import com.nexus.workspace.domain.repository.ReflectionRepository;
import com.nexus.workspace.interfaces.dto.request.UpsertReflectionRequest;
import com.nexus.workspace.interfaces.dto.response.ReflectionResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
public class ReflectionApplicationService {

    private final ReflectionRepository reflectionRepository;

    public ReflectionApplicationService(ReflectionRepository reflectionRepository) {
        this.reflectionRepository = reflectionRepository;
    }

    @Transactional(readOnly = true)
    public List<ReflectionResponse> getReflections(Long userId) {
        return reflectionRepository.findByUserId(userId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public ReflectionResponse upsertReflection(Long userId, UpsertReflectionRequest request) {
        ReflectionScope scope = ReflectionScope.fromString(request.getScope());
        validatePeriodKey(scope, request.getPeriodKey());
        String content = request.getContent() != null ? request.getContent().trim() : "";
        if (content.isEmpty()) {
            throw new BusinessException(400, "感悟内容不能为空");
        }

        UserReflection existing = reflectionRepository.findByUserScopeAndPeriod(
            userId,
            scope,
            request.getPeriodKey()
        );
        if (existing != null) {
            existing.setContent(content);
            reflectionRepository.save(existing);
            log.info("Reflection updated: userId={}, scope={}, period={}", userId, scope, request.getPeriodKey());
            return toResponse(existing);
        }

        UserReflection created = new UserReflection();
        created.setUserId(userId);
        created.setScope(scope);
        created.setPeriodKey(request.getPeriodKey());
        created.setContent(content);
        reflectionRepository.save(created);
        log.info("Reflection created: userId={}, scope={}, period={}", userId, scope, request.getPeriodKey());
        return toResponse(created);
    }

    @Transactional
    public void deleteReflection(Long userId, Long id) {
        List<UserReflection> all = reflectionRepository.findByUserId(userId);
        UserReflection target = all.stream().filter(item -> item.getId().equals(id)).findFirst().orElse(null);
        if (target == null) {
            throw new BusinessException(404, "感悟不存在");
        }
        reflectionRepository.delete(id);
        log.info("Reflection deleted: userId={}, id={}", userId, id);
    }

    private void validatePeriodKey(ReflectionScope scope, String periodKey) {
        if (periodKey == null || periodKey.isBlank()) {
            throw new BusinessException(400, "时间周期不能为空");
        }
        boolean valid = switch (scope) {
            case day -> periodKey.matches("\\d{4}-\\d{2}-\\d{2}");
            case month -> periodKey.matches("\\d{4}-\\d{2}");
            case year -> periodKey.matches("\\d{4}");
        };
        if (!valid) {
            throw new BusinessException(400, "时间周期格式不正确");
        }
    }

    private ReflectionResponse toResponse(UserReflection reflection) {
        ReflectionResponse response = new ReflectionResponse();
        response.setId(reflection.getId());
        response.setScope(reflection.getScope().name());
        response.setPeriodKey(reflection.getPeriodKey());
        response.setContent(reflection.getContent());
        response.setCreatedAt(reflection.getCreatedAt());
        response.setUpdatedAt(reflection.getUpdatedAt());
        return response;
    }
}
