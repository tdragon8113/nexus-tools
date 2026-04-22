package com.nexus.user.infrastructure.persistence.repository;

import com.nexus.user.domain.model.User;
import com.nexus.user.domain.model.UserId;
import com.nexus.user.domain.repository.UserRepository;
import com.nexus.user.infrastructure.persistence.mapper.UserMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 用户仓储实现（持久化层）
 */
@Slf4j
@Repository
public class UserRepositoryImpl implements UserRepository {

    private final UserMapper userMapper;

    public UserRepositoryImpl(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    @Override
    public User findById(UserId id) {
        return userMapper.selectById(id.value());
    }

    @Override
    public Optional<User> findByUsername(String username) {
        User user = userMapper.findByUsername(username);
        return Optional.ofNullable(user);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        User user = userMapper.findByEmail(email);
        return Optional.ofNullable(user);
    }

    @Override
    public void save(User user) {
        if (user.getIdValue() == null) {
            userMapper.insert(user);
        } else {
            userMapper.updateById(user);
        }
    }

    @Override
    public void delete(UserId id) {
        userMapper.deleteById(id.value());
    }

    @Override
    public boolean existsByUsername(String username) {
        return userMapper.findByUsername(username) != null;
    }

    @Override
    public boolean existsByEmail(String email) {
        return userMapper.findByEmail(email) != null;
    }
}