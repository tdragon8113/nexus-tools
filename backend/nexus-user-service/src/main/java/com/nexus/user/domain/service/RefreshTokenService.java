package com.nexus.user.domain.service;

import com.nexus.user.domain.model.UserId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Refresh Token 服务（领域服务）
 */
@Service
public class RefreshTokenService {

    private final StringRedisTemplate redis;
    private final long refreshTokenExpiration;

    private static final String TOKEN_KEY_PREFIX = "refresh:tokens:";
    private static final String USER_INDEX_PREFIX = "refresh:user:";

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
        String tokenKey = tokenKey(token);
        String userIndexKey = userIndexKey(userId);

        redis.opsForValue().set(tokenKey, userId.value().toString(), refreshTokenExpiration, TimeUnit.SECONDS);
        redis.opsForSet().add(userIndexKey, token);
        redis.expire(userIndexKey, refreshTokenExpiration, TimeUnit.SECONDS);
        return token;
    }

    /**
     * 验证 Refresh Token，返回 userId
     */
    public Optional<UserId> validateRefreshToken(String token) {
        if (token == null || !token.startsWith("rt-")) {
            return Optional.empty();
        }
        String userIdStr = redis.opsForValue().get(tokenKey(token));
        if (userIdStr == null) {
            return Optional.empty();
        }
        return Optional.of(new UserId(Long.parseLong(userIdStr)));
    }

    /**
     * 撤销 Refresh Token（强制登出）
     */
    public void revokeRefreshToken(String token) {
        if (token == null || !token.startsWith("rt-")) {
            return;
        }
        String tokenKey = tokenKey(token);
        String userIdStr = redis.opsForValue().get(tokenKey);
        redis.delete(tokenKey);
        if (userIdStr != null) {
            redis.opsForSet().remove(userIndexKey(new UserId(Long.parseLong(userIdStr))), token);
        }
    }

    /**
     * 删除用户所有 Refresh Token（账号删除时调用）
     */
    public void revokeAllUserTokens(UserId userId) {
        String userIndexKey = userIndexKey(userId);
        Set<String> tokens = redis.opsForSet().members(userIndexKey);
        if (tokens != null) {
            for (String token : tokens) {
                redis.delete(tokenKey(token));
            }
        }
        redis.delete(userIndexKey);
    }

    private static String tokenKey(String token) {
        return TOKEN_KEY_PREFIX + token;
    }

    private static String userIndexKey(UserId userId) {
        return USER_INDEX_PREFIX + userId.value();
    }
}
