package com.nexus.user.domain.model;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * 用户聚合根（富领域模型）
 */
@Getter
@TableName("users")
public class User {
    private UserId id;
    private String username;
    private String email;
    private String password;
    private String nickname;
    @TableField("avatar")
    private String avatarUrl;
    private UserStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public User() {}

    // 创建新用户
    public static User create(String username, String email, String encodedPassword) {
        User user = new User();
        user.username = username;
        user.email = email;
        user.password = encodedPassword;
        user.status = UserStatus.ACTIVE;
        user.createdAt = LocalDateTime.now();
        return user;
    }

    // 更新用户信息
    public void updateProfile(String nickname, String avatarUrl) {
        this.nickname = nickname;
        this.avatarUrl = avatarUrl;
        this.updatedAt = LocalDateTime.now();
    }

    // 验证密码
    public boolean verifyPassword(String rawPassword, org.springframework.security.crypto.password.PasswordEncoder encoder) {
        return encoder.matches(rawPassword, this.password);
    }

    // 禁用用户
    public void disable() {
        this.status = UserStatus.DISABLED;
        this.updatedAt = LocalDateTime.now();
    }

    // 删除用户（软删除标记）
    public void markDeleted() {
        this.status = UserStatus.DELETED;
        this.updatedAt = LocalDateTime.now();
    }

    // 是否可以登录
    public boolean canLogin() {
        return status.isActive();
    }

    // 基础设施层使用的 setter
    public void setId(UserId id) {
        this.id = id;
    }

    public void setIdValue(Long value) {
        this.id = value != null ? new UserId(value) : null;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public void setStatus(UserStatus status) {
        this.status = status;
    }

    public void setStatusFromCode(int code) {
        this.status = UserStatus.fromCode(code);
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    // 用于基础设施层
    public Long getIdValue() {
        return id != null ? id.value() : null;
    }

    public int getStatusCode() {
        return status != null ? status.getCode() : 1;
    }
}