package com.nexus.user.application.service;

import com.nexus.common.exception.BusinessException;
import com.nexus.common.security.JwtUtils;
import com.nexus.user.application.command.LoginCommand;
import com.nexus.user.application.command.RegisterCommand;
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

        String email = command.email();
        if (email == null || email.isBlank()) {
            email = command.username().trim().toLowerCase() + "@timejournal.local";
        }
        if (userRepository.existsByEmail(email)) {
            throw new BusinessException(1005, "邮箱已被注册");
        }

        String encodedPassword = passwordService.encode(command.password());
        User user = User.create(command.username(), email, encodedPassword);
        if (command.nickname() != null && !command.nickname().isBlank()) {
            user.updateProfile(command.nickname().trim(), null);
        }
        userRepository.save(user);

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

        log.info("User logged in: {}", user.getUsername());

        return new TokenResponse(accessToken, refreshToken, toResponse(user));
    }

    public TokenResponse refreshToken(String refreshToken) {
        UserId userId = refreshTokenService.consumeRefreshToken(refreshToken)
                .orElseThrow(() -> new BusinessException(401, "无效的 Refresh Token"));

        User user = userRepository.findById(userId);
        if (user == null) {
            throw BusinessException.userNotFound();
        }

        String accessToken = jwtUtils.generateToken(userId.value(), user.getUsername());
        String newRefreshToken = refreshTokenService.generateRefreshToken(userId);
        log.info("Token refreshed for user: {}", user.getUsername());

        return TokenResponse.forRefresh(accessToken, newRefreshToken);
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
    public UserResponse updateProfile(Long userId, String nickname) {
        User user = userRepository.findById(new UserId(userId));
        if (user == null) {
            throw BusinessException.userNotFound();
        }

        String trimmed = nickname != null ? nickname.trim() : null;
        user.updateProfile(trimmed != null && !trimmed.isEmpty() ? trimmed : null, user.getAvatarUrl());
        userRepository.save(user);
        log.info("User profile updated: {}", user.getUsername());
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

    @Transactional
    public void changePassword(Long userId, String currentPassword, String newPassword, String confirmPassword) {
        User user = userRepository.findById(new UserId(userId));
        if (user == null) {
            throw BusinessException.userNotFound();
        }
        if (!user.verifyPassword(currentPassword, passwordService.getEncoder())) {
            throw BusinessException.invalidPassword();
        }
        if (newPassword == null || newPassword.length() < 6) {
            throw new BusinessException(400, "新密码长度至少6字符");
        }
        if (confirmPassword == null || !newPassword.equals(confirmPassword)) {
            throw new BusinessException(400, "两次输入的新密码不一致");
        }
        if (currentPassword.equals(newPassword)) {
            throw new BusinessException(400, "新密码不能与当前密码相同");
        }

        user.changePassword(passwordService.encode(newPassword));
        userRepository.save(user);
        refreshTokenService.revokeAllUserTokens(new UserId(userId));
        log.info("User password changed: {}", user.getUsername());
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