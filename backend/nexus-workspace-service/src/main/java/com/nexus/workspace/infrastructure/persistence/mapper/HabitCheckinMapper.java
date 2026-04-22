package com.nexus.workspace.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.nexus.workspace.domain.model.habit.HabitCheckin;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

/**
 * 习惯打卡 Mapper（持久化层）
 */
@Mapper
public interface HabitCheckinMapper extends BaseMapper<HabitCheckin> {
    List<HabitCheckin> findByHabitId(@Param("habitId") Long habitId);
    List<HabitCheckin> findByHabitIdAndDateRange(
        @Param("habitId") Long habitId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
    HabitCheckin findByHabitIdAndDate(
        @Param("habitId") Long habitId,
        @Param("checkinDate") LocalDate checkinDate
    );
}