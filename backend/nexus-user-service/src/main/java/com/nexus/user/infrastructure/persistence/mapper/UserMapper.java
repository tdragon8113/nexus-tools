package com.nexus.user.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.nexus.user.domain.model.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 用户 Mapper（持久化层）
 */
@Mapper
public interface UserMapper extends BaseMapper<User> {
    User findByUsername(@Param("username") String username);

    User findByEmail(@Param("email") String email);

    /**
     * By-primary-key load using XML {@code UserResultMap} so {@code UserId} is populated.
     * {@link BaseMapper#selectById} does not map the DB {@code id} column into {@code UserId}.
     */
    User findUserByPk(@Param("id") Long id);

    int insertUser(User user);

    int updateUser(User user);
}