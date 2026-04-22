package com.nexus.user.domain.event;

import com.nexus.user.domain.model.UserId;

import java.time.LocalDateTime;

/**
 * 用户注册事件
 */
public record UserRegisteredEvent(
    UserId userId,
    String username,
    String email,
    LocalDateTime occurredAt
) {
    public UserRegisteredEvent(UserId userId, String username, String email) {
        this(userId, username, email, LocalDateTime.now());
    }
}