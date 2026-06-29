package com.nexus.workspace.infrastructure.persistence.repository;

import com.nexus.workspace.domain.model.reflection.ReflectionScope;
import com.nexus.workspace.domain.model.reflection.UserReflection;
import com.nexus.workspace.domain.repository.ReflectionRepository;
import com.nexus.workspace.infrastructure.persistence.mapper.ReflectionMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class ReflectionRepositoryImpl implements ReflectionRepository {

    private final ReflectionMapper reflectionMapper;

    public ReflectionRepositoryImpl(ReflectionMapper reflectionMapper) {
        this.reflectionMapper = reflectionMapper;
    }

    @Override
    public List<UserReflection> findByUserId(Long userId) {
        return reflectionMapper.findByUserId(userId);
    }

    @Override
    public UserReflection findByUserScopeAndPeriod(Long userId, ReflectionScope scope, String periodKey) {
        return reflectionMapper.findByUserScopeAndPeriod(userId, scope, periodKey);
    }

    @Override
    public void save(UserReflection reflection) {
        if (reflection.getId() == null) {
            reflectionMapper.insertReflection(reflection);
        } else {
            reflectionMapper.updateReflection(reflection);
        }
    }

    @Override
    public void delete(Long id) {
        reflectionMapper.deleteById(id);
    }
}
