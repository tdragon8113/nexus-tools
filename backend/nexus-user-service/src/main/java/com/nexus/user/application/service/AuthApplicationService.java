package com.nexus.user.application.service;

import com.nexus.common.exception.BusinessException;
import com.nexus.common.security.JwtUtils;
import com.nexus.user.application.command.LoginCommand;
import com.nexus.user.application.command.RegisterCommand;
import com.nexus.user.domain.event.UserLoggedInEvent;
import com.nexus.user.domain.event.UserRegisteredEvent;
import com.nexus.user.domain.model.User;
import com.nexus.user.domain.model.UserId;
import com.nexus.user.domain.repository.UserRepository;
import com.nexus.user.domain.service.PasswordService;
import com.nexus.user.domain.service.RefreshTokenService;
import com.nexus.user.interfaces.dto.response.TokenResponse;
import com.nexus.user.interfaces.dto.response.UserResponse;
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
    private final JwtUtils jwtUtils;
    private final RefreshTokenService refreshTokenService;

    public AuthApplicationService(
            UserRepository userRepository,
            PasswordService passwordService,
            JwtUtils jwtUtils,
            RefreshTokenService refreshTokenService) {
        this.userRepository = userRepository;
        this.passwordService = passwordService;
        this.jwtUtils = jwtUtils;
        this.refreshTokenService = refreshTokenService;
    }

    @Transactional
    public UserResponse register(RegisterCommand command) {
        if (userRepository.existsByUsername(command.username())) {
            throw BusinessException.userAlreadyExists();
        }

        if (userRepository.existsByEmail(command.email())) {
            throw new BusinessException(1005, "邮箱已被注册");
        }

        String encodedPassword = passwordService.encode(command.password());
        User user = User.create(command.username(), command.email(), encodedPassword);
        userRepository.save(user);

        UserRegisteredEvent event = new UserRegisteredEvent(user.getId(), user.getUsername(), user.getEmail());
        log.info("User registered: {}", user.getUsername());

        return toResponse(user);
    }

    public TokenResponse login(LoginCommand command) {
        User user = userRepository.findByUsername(command.username())
                .orElseThrow(BusinessException::userNotFound);

        if (!user.canLogin()) {
            throw new BusinessException(403, "用户已被禁用");
        }

        if (!user.verifyPassword(command.password(), passwordService.getEncoder())) {
            throw BusinessException.invalidPassword();
        }

        String accessToken = jwtUtils.generateToken(user.getIdValue(), user.getUsername());
        String refreshToken = refreshTokenService.generateRefreshToken(user.getId());

        UserLoggedInEvent event = new UserLoggedInEvent(user.getId(), user.getUsername());
        log.info("User logged in: {}", user.getUsername());

        return new TokenResponse(accessToken, refreshToken, toResponse(user));
    }

    public TokenResponse refreshToken(String refreshToken) {
        UserId userId = refreshTokenService.validateRefreshToken(refreshToken)
                .orElseThrow(() -> new BusinessException(401, "无效的 Refresh Token"));

        User user = userRepository.findById(userId);
        if (user == null) {
            throw BusinessException.userNotFound();
        }

        String accessToken = jwtUtils.generateToken(userId.value(), user.getUsername());
        log.info("Token refreshed for user: {}", user.getUsername());

        return TokenResponse.forRefresh(accessToken);
    }

    public void logout(String refreshToken) {
        refreshTokenService.revokeRefreshToken(refreshToken);
        log.info("User logged out, refresh token revoked");
    }

    public UserResponse getCurrentUser(Long userId) {
        User user = userRepository.findById(new UserId(userId));
        if (user == null) {
            throw BusinessException.userNotFound();
        }
        return toResponse(user);
    }

    @Transactional
    public void deleteAccount(Long userId, String refreshToken) {
        User user = userRepository.findById(new UserId(userId));
        if (user == null) {
            throw BusinessException.userNotFound();
        }

        refreshTokenService.revokeAllUserTokens(new UserId(userId));
        userRepository.delete(new UserId(userId));
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