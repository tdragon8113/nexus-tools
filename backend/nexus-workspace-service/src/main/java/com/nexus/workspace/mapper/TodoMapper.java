package com.nexus.workspace.mapper;

import com.nexus.workspace.entity.Todo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface TodoMapper {
    Todo findById(@Param("id") Long id);
    List<Todo> findByUserId(@Param("userId") Long userId);
    List<Todo> findByUserIdAndDate(@Param("userId") Long userId, @Param("dueDate") LocalDateTime dueDate);
    List<Todo> findByUserIdAndDateRange(
        @Param("userId") Long userId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
    int insert(Todo todo);
    int update(Todo todo);
    int deleteById(@Param("id") Long id);
}