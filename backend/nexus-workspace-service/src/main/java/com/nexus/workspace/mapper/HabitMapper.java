package com.nexus.workspace.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.nexus.workspace.entity.Habit;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface HabitMapper extends BaseMapper<Habit> {
    List<Habit> findByUserId(@Param("userId") Long userId);
}