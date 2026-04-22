package com.nexus.user.domain.service;

import com.nexus.user.domain.model.UserId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Refresh Token 服务（领域服务）
 */
@Service
public class RefreshTokenService {

    private final StringRedisTemplate redis;
    private final long refreshTokenExpiration;

    private static final String KEY_PREFIX = "refresh:tokens:";

    public RefreshTokenService(
            StringRedisTemplate redis,
            @Value("${jwt.refresh-token-expiration:604800}") long refreshTokenExpiration) {
        this.redis = redis;
        this.refreshTokenExpiration = refreshTokenExpiration;
    }

    /**
     * 生成 Refresh Token 并存储到 Redis
     */
    public String generateRefreshToken(UserId userId) {
        String token = "rt-" + UUID.randomUUID().toString().replace("-", "");
        String key = KEY_PREFIX + token;
        redis.opsForValue().set(key, userId.value().toString(), refreshTokenExpiration, TimeUnit.SECONDS);
        return token;
    }

    /**
     * 验证 Refresh Token，返回 userId
     */
    public Optional<UserId> validateRefreshToken(String token) {
        if (token == null || !token.startsWith("rt-")) {
            return Optional.empty();
        }
        String key = KEY_PREFIX + token;
        String userIdStr = redis.opsForValue().get(key);
        if (userIdStr == null) {
            return Optional.empty();
        }
        return Optional.of(new UserId(Long.parseLong(userIdStr)));
    }

    /**
     * 撤销 Refresh Token（强制登出）
     */
    public void revokeRefreshToken(String token) {
        if (token != null && token.startsWith("rt-")) {
            String key = KEY_PREFIX + token;
            redis.delete(key);
        }
    }

    /**
     * 删除用户所有 Refresh Token（账号删除时调用）
     */
    public void revokeAllUserTokens(UserId userId) {
        // 扫描并删除所有属于该用户的 refresh token
        redis.keys(KEY_PREFIX + "*").forEach(key -> {
            String value = redis.opsForValue().get(key);
            if (value != null && value.equals(userId.value().toString())) {
                redis.delete(key);
            }
        });
    }
}