package com.nexus.user.interfaces.dto.response;

import lombok.Data;

/**
 * Token 响应 DTO
 */
@Data
public class TokenResponse {
    private String accessToken;
    private String refreshToken;
    private UserResponse user;

    public TokenResponse() {}

    public TokenResponse(String accessToken, String refreshToken, UserResponse user) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.user = user;
    }

    /**
     * 刷新 Token 时使用（轮换 access + refresh，不含 user）
     */
    public static TokenResponse forRefresh(String accessToken, String refreshToken) {
        TokenResponse response = new TokenResponse();
        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken);
        return response;
    }
}