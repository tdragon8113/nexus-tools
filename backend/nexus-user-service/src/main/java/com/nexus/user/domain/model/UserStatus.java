package com.nexus.user.domain.model;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.baomidou.mybatisplus.annotation.IEnum;

/**
 * 用户状态值对象
 */
public enum UserStatus implements IEnum<Integer> {
    ACTIVE(1, "正常"),
    DISABLED(0, "禁用"),
    DELETED(-1, "已删除");

    @EnumValue
    private final int code;
    private final String description;

    UserStatus(int code, String description) {
        this.code = code;
        this.description = description;
    }

    @Override
    public Integer getValue() {
        return code;
    }

    public int getCode() {
        return code;
    }

    public String getDescription() {
        return description;
    }

    public static UserStatus fromCode(int code) {
        return switch (code) {
            case 1 -> ACTIVE;
            case 0 -> DISABLED;
            case -1 -> DELETED;
            default -> ACTIVE;
        };
    }

    public boolean isActive() {
        return this == ACTIVE;
    }
}