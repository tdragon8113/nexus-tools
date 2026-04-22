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
     * 刷新 Token 时使用（只返回 accessToken）
     */
    public static TokenResponse forRefresh(String accessToken) {
        TokenResponse response = new TokenResponse();
        response.setAccessToken(accessToken);
        return response;
    }
}