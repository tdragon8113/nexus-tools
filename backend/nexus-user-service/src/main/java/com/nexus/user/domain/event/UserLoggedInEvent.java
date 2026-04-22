package com.nexus.user.domain.event;

import com.nexus.user.domain.model.UserId;

import java.time.LocalDateTime;

/**
 *用户登录事件
 */
public record UserLoggedInEvent(
    UserId userId,
    String username,
    LocalDateTime occurredAt
) {
    public UserLoggedInEvent(UserId userId, String username) {
        this(userId, username, LocalDateTime.now());
    }
}