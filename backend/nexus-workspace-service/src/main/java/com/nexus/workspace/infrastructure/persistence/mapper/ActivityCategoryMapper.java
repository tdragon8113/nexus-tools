package com.nexus.workspace.infrastructure.persistence.mapper;

import com.nexus.workspace.domain.model.category.UserActivityCategory;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ActivityCategoryMapper {
    List<UserActivityCategory> findByUserId(@Param("userId") Long userId);

    UserActivityCategory findByUserIdAndSlug(@Param("userId") Long userId, @Param("slug") String slug);

    int insertCategory(UserActivityCategory category);

    int updateCategory(UserActivityCategory category);

    int deleteByUserId(@Param("userId") Long userId);

    int deleteByUserIdAndSlug(@Param("userId") Long userId, @Param("slug") String slug);
}
