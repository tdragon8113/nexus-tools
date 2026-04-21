package com.nexus.workspace.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.nexus.workspace.entity.HabitCheckin;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.time.LocalDate;
import java.util.List;

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