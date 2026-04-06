package com.nexus.user.service;

import com.nexus.common.exception.BusinessException;
import com.nexus.user.dto.LoginRequest;
import com.nexus.user.dto.RegisterRequest;
import com.nexus.user.dto.UserResponse;
import com.nexus.user.entity.User;
import com.nexus.user.mapper.UserMapper;
import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
public class AuthService {

    private final UserMapper userMapper;
    private final BCryptPasswordEncoder passwordEncoder;

    public AuthService(UserMapper userMapper) {
        this.userMapper = userMapper;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (userMapper.findByUsername(request.getUsername()) != null) {
            throw BusinessException.userAlreadyExists();
        }

        if (userMapper.findByEmail(request.getEmail()) != null) {
            throw new BusinessException(1005, "邮箱已被注册");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setStatus(1);
        user.setCreatedAt(LocalDateTime.now());

        userMapper.insert(user);
        log.info("User registered: {}", user.getUsername());

        return toResponse(user);
    }

    public UserResponse login(LoginRequest request, HttpSession session) {
        User user = userMapper.findByUsername(request.getUsername());
        if (user == null) {
            throw BusinessException.userNotFound();
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw BusinessException.invalidPassword();
        }

        session.setAttribute("userId", user.getId());
        session.setAttribute("username", user.getUsername());
        log.info("User logged in: {}", user.getUsername());

        return toResponse(user);
    }

    public void logout(HttpSession session) {
        String username = (String) session.getAttribute("username");
        session.invalidate();
        log.info("User logged out: {}", username);
    }

    public UserResponse getCurrentUser(Long userId) {
        User user = userMapper.findById(userId);
        if (user == null) {
            throw BusinessException.userNotFound();
        }
        return toResponse(user);
    }

    private UserResponse toResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setNickname(user.getNickname());
        response.setAvatarUrl(user.getAvatarUrl());
        return response;
    }
}