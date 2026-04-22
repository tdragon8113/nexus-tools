package com.nexus.user.domain.model;

/**
 * 用户 ID 值对象
 */
public record UserId(Long value) {
    public UserId {
        if (value == null || value <= 0) {
            throw new IllegalArgumentException("无效的用户 ID");
        }
    }
}