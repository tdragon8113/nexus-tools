package com.nexus.user.interfaces.dto.response;

import lombok.Data;

/**
 * 用户响应 DTO
 */
@Data
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private String nickname;
    private String avatarUrl;
}