package com.nexus.workspace.domain.repository;

import com.nexus.workspace.domain.model.reflection.ReflectionScope;
import com.nexus.workspace.domain.model.reflection.UserReflection;

import java.util.List;

public interface ReflectionRepository {
    List<UserReflection> findByUserId(Long userId);

    UserReflection findByUserScopeAndPeriod(Long userId, ReflectionScope scope, String periodKey);

    void save(UserReflection reflection);

    void delete(Long id);
}
