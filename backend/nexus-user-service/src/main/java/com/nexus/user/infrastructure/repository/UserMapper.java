package com.nexus.user.infrastructure.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.nexus.user.domain.model.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 用户 Mapper（基础设施层）
 */
@Mapper
public interface UserMapper extends BaseMapper<User> {
    User findByUsername(@Param("username") String username);
    User findByEmail(@Param("email") String email);
}