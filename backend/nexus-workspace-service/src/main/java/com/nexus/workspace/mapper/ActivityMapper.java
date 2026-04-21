package com.nexus.workspace.mapper;

import com.nexus.workspace.entity.Activity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface ActivityMapper {
    Activity findById(@Param("id") Long id);
    List<Activity> findByUserId(@Param("userId") Long userId);
    List<Activity> findByUserIdAndDateRange(
        @Param("userId") Long userId,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime
    );
    int insert(Activity activity);
    int deleteById(@Param("id") Long id);
}