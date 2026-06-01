package com.nexus.user.interfaces.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 更新个人资料请求 DTO
 */
@Data
public class UpdateProfileRequest {
    @Size(max = 50, message = "昵称最多 50 个字符")
    private String nickname;
}
