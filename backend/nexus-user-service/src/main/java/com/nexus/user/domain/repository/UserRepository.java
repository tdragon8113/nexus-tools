package com.nexus.user.domain.repository;

import com.nexus.user.domain.model.User;
import com.nexus.user.domain.model.UserId;

import java.util.Optional;

/**
 * 用户仓储接口
 */
public interface UserRepository {
    User findById(UserId id);
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    void save(User user);
    void delete(UserId id);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
}