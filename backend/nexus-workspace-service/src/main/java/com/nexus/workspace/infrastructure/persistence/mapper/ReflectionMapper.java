package com.nexus.workspace.infrastructure.persistence.mapper;

import com.nexus.workspace.domain.model.reflection.ReflectionScope;
import com.nexus.workspace.domain.model.reflection.UserReflection;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ReflectionMapper {
    List<UserReflection> findByUserId(@Param("userId") Long userId);

    UserReflection findByUserScopeAndPeriod(
        @Param("userId") Long userId,
        @Param("scope") ReflectionScope scope,
        @Param("periodKey") String periodKey
    );

    int insertReflection(UserReflection reflection);

    int updateReflection(UserReflection reflection);

    int deleteById(@Param("id") Long id);
}
