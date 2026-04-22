package com.nexus.user.interfaces.controller;

import com.nexus.common.dto.ApiResponse;
import com.nexus.user.application.command.LoginCommand;
import com.nexus.user.application.command.RegisterCommand;
import com.nexus.user.application.service.AuthApplicationService;
import com.nexus.user.interfaces.dto.request.LoginRequest;
import com.nexus.user.interfaces.dto.request.RegisterRequest;
import com.nexus.user.interfaces.dto.response.UserResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

/**
 * 认证控制器（接口层）
 */
@Slf4j
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthApplicationService authApplicationService;

    public AuthController(AuthApplicationService authApplicationService) {
        this.authApplicationService = authApplicationService;
    }

    @PostMapping("/register")
    public ApiResponse<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        RegisterCommand command = new RegisterCommand(
            request.getUsername(),
            request.getEmail(),
            request.getPassword()
        );
        return ApiResponse.success(authApplicationService.register(command));
    }

    @PostMapping("/login")
    public ApiResponse<UserResponse> login(@Valid @RequestBody LoginRequest request, HttpSession session) {
        LoginCommand command = new LoginCommand(request.getUsername(), request.getPassword());
        return ApiResponse.success(authApplicationService.login(command, session));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(HttpSession session) {
        authApplicationService.logout(session);
        return ApiResponse.success();
    }

    @GetMapping("/me")
    public ApiResponse<UserResponse> getCurrentUser(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            HttpSession session) {
        if (userId == null) {
            Object sessionUserId = session.getAttribute("userId");
            if (sessionUserId != null) {
                userId = Long.parseLong(sessionUserId.toString());
            }
        }
        if (userId == null) {
            log.warn("getCurrentUser called without userId");
            return ApiResponse.error(401, "未登录");
        }
        return ApiResponse.success(authApplicationService.getCurrentUser(userId));
    }

    @DeleteMapping("/account")
    public ApiResponse<Void> deleteAccount(@RequestHeader("X-User-Id") Long userId, HttpSession session) {
        authApplicationService.deleteAccount(userId, session);
        return ApiResponse.success();
    }
}