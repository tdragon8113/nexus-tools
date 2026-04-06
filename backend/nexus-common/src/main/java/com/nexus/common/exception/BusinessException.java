package com.nexus.common.exception;

import com.nexus.common.constants.ResultCode;
import lombok.Getter;

@Getter
public class BusinessException extends RuntimeException {
    private final int code;

    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
    }

    public BusinessException(String message) {
        super(message);
        this.code = ResultCode.INTERNAL_ERROR;
    }

    public static BusinessException userNotFound() {
        return new BusinessException(ResultCode.USER_NOT_FOUND, "用户不存在");
    }

    public static BusinessException userAlreadyExists() {
        return new BusinessException(ResultCode.USER_ALREADY_EXISTS, "用户已存在");
    }

    public static BusinessException invalidPassword() {
        return new BusinessException(ResultCode.INVALID_PASSWORD, "密码错误");
    }

    public static BusinessException unauthorized() {
        return new BusinessException(ResultCode.UNAUTHORIZED, "未登录或 Session 已过期");
    }
}