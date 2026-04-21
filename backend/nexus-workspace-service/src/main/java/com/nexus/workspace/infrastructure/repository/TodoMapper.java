package com.nexus.workspace.infrastructure.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.nexus.workspace.domain.model.todo.Todo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Todo Mapper（基础设施层）
 */
@Mapper
public interface TodoMapper extends BaseMapper<Todo> {
    List<Todo> findByUserId(@Param("userId") Long userId);
    List<Todo> findByUserIdAndDate(@Param("userId") Long userId, @Param("dueDate") LocalDateTime dueDate);
    List<Todo> findByUserIdAndDateRange(
        @Param("userId") Long userId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
}