package com.nexus.workspace.mapper;

import com.nexus.workspace.entity.Habit;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface HabitMapper {
    Habit findById(@Param("id") Long id);
    List<Habit> findByUserId(@Param("userId") Long userId);
    int insert(Habit habit);
    int update(Habit habit);
    int deleteById(@Param("id") Long id);
}