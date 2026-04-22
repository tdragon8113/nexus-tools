package com.nexus.user.application.service;

import com.nexus.common.exception.BusinessException;
import com.nexus.user.application.command.LoginCommand;
import com.nexus.user.application.command.RegisterCommand;
import com.nexus.user.domain.event.UserLoggedInEvent;
import com.nexus.user.domain.event.UserRegisteredEvent;
import com.nexus.user.domain.model.User;
import com.nexus.user.domain.model.UserId;
import com.nexus.user.domain.repository.UserRepository;
import com.nexus.user.domain.service.PasswordService;
import com.nexus.user.interfaces.dto.response.UserResponse;
import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 认证应用服务（编排）
 */
@Slf4j
@Service
public class AuthApplicationService {

    private final UserRepository userRepository;
    private final PasswordService passwordService;

    public AuthApplicationService(UserRepository userRepository, PasswordService passwordService) {
        this.userRepository = userRepository;
        this.passwordService = passwordService;
    }

    @Transactional
    public UserResponse register(RegisterCommand command) {
        // 检查用户名是否已存在
        if (userRepository.existsByUsername(command.username())) {
            throw BusinessException.userAlreadyExists();
        }

        // 检查邮箱是否已存在
        if (userRepository.existsByEmail(command.email())) {
            throw new BusinessException(1005, "邮箱已被注册");
        }

        // 创建用户
        String encodedPassword = passwordService.encode(command.password());
        User user = User.create(command.username(), command.email(), encodedPassword);
        userRepository.save(user);

        // 发布领域事件
        UserRegisteredEvent event = new UserRegisteredEvent(user.getId(), user.getUsername(), user.getEmail());
        log.info("User registered: {}", user.getUsername());

        return toResponse(user);
    }

    public UserResponse login(LoginCommand command, HttpSession session) {
        User user = userRepository.findByUsername(command.username())
            .orElseThrow(BusinessException::userNotFound);

        if (!user.canLogin()) {
            throw new BusinessException(403, "用户已被禁用");
        }

        if (!user.verifyPassword(command.password(), passwordService.getEncoder())) {
            throw BusinessException.invalidPassword();
        }

        session.setAttribute("userId", user.getIdValue());
        session.setAttribute("username", user.getUsername());

        UserLoggedInEvent event = new UserLoggedInEvent(user.getId(), user.getUsername());
        log.info("User logged in: {}", user.getUsername());

        return toResponse(user);
    }

    public void logout(HttpSession session) {
        String username = (String) session.getAttribute("username");
        session.invalidate();
        log.info("User logged out: {}", username);
    }

    public UserResponse getCurrentUser(Long userId) {
        User user = userRepository.findById(new UserId(userId));
        if (user == null) {
            throw BusinessException.userNotFound();
        }
        return toResponse(user);
    }

    @Transactional
    public void deleteAccount(Long userId, HttpSession session) {
        User user = userRepository.findById(new UserId(userId));
        if (user == null) {
            throw BusinessException.userNotFound();
        }

        userRepository.delete(new UserId(userId));
        session.invalidate();
        log.info("User account deleted: {}", user.getUsername());
    }

    private UserResponse toResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getIdValue());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setNickname(user.getNickname());
        response.setAvatarUrl(user.getAvatarUrl());
        return response;
    }
}