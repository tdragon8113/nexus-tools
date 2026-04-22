package com.nexus.common.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import java.util.Date;

/**
 * JWT 工具类
 * 通过 JwtAutoConfiguration 注册为 Bean
 */
public class JwtUtils {

    private final SecretKey secretKey;
    private final long accessTokenExpiration;

    public JwtUtils(String secretKey, long accessTokenExpiration) {
        this.secretKey = Keys.hmacShaKeyFor(secretKey.getBytes());
        this.accessTokenExpiration = accessTokenExpiration;
    }

    /**
     * 生成 Access Token
     */
    public String generateToken(Long userId, String username) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(userId.toString())
                .claim("username", username)
                .issuedAt(new Date(now))
                .expiration(new Date(now + accessTokenExpiration * 1000))
                .signWith(secretKey)
                .compact();
    }

    /**
     * 解析 Token 获取 Claims
     */
    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * 提取 userId（返回 Long）
     */
    public Long extractUserId(String token) {
        return Long.parseLong(parseToken(token).getSubject());
    }

    /**
     * 提取 userId（返回 String，供 Gateway 使用）
     */
    public String extractUserIdAsString(String token) {
        return parseToken(token).getSubject();
    }

    /**
     * 提取 username
     */
    public String extractUsername(String token) {
        return parseToken(token).get("username", String.class);
    }

    /**
     * 验证 Token 是否有效
     */
    public boolean validateToken(String token) {
        try {
            parseToken(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}