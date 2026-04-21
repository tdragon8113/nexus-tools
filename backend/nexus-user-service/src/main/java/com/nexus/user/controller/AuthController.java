package com.nexus.user.controller;

import com.nexus.common.dto.ApiResponse;
import com.nexus.user.dto.LoginRequest;
import com.nexus.user.dto.RegisterRequest;
import com.nexus.user.dto.UserResponse;
import com.nexus.user.service.AuthService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ApiResponse<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.success(authService.register(request));
    }

    @PostMapping("/login")
    public ApiResponse<UserResponse> login(@Valid @RequestBody LoginRequest request, HttpSession session) {
        return ApiResponse.success(authService.login(request, session));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(HttpSession session) {
        authService.logout(session);
        return ApiResponse.success();
    }

    @GetMapping("/me")
    public ApiResponse<UserResponse> getCurrentUser(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            HttpSession session) {
        // 优先从 header 获取，否则从 session 获取
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
        return ApiResponse.success(authService.getCurrentUser(userId));
    }

    @DeleteMapping("/account")
    public ApiResponse<Void> deleteAccount(@RequestHeader("X-User-Id") Long userId, HttpSession session) {
        authService.deleteAccount(userId, session);
        return ApiResponse.success();
    }
}