package com.nexus.workspace.infrastructure.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.nexus.workspace.domain.model.activity.Activity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Activity Mapper（基础设施层）
 */
@Mapper
public interface ActivityMapper extends BaseMapper<Activity> {
    List<Activity> findByUserId(@Param("userId") Long userId);
    List<Activity> findByUserIdAndDateRange(
        @Param("userId") Long userId,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime
    );
}