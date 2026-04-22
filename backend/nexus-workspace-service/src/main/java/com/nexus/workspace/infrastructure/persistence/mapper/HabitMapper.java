package com.nexus.workspace.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.nexus.workspace.domain.model.habit.Habit;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 习惯 Mapper（持久化层）
 */
@Mapper
public interface HabitMapper extends BaseMapper<Habit> {
    List<Habit> findByUserId(@Param("userId") Long userId);
}