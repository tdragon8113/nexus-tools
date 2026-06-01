package com.nexus.common.support;

import com.nexus.common.constants.ResultCode;
import com.nexus.common.exception.BusinessException;

import java.util.function.Predicate;

/**
 * 校验资源存在且归属当前用户，统一 404 / 403 语义。
 */
public final class ResourceAccessChecker {

    private ResourceAccessChecker() {}

    public static <T> T requireOwned(T entity, Predicate<T> belongsTo, String resourceName) {
        if (entity == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, resourceName + "不存在");
        }
        if (!belongsTo.test(entity)) {
            throw new BusinessException(ResultCode.FORBIDDEN, "无权访问");
        }
        return entity;
    }
}
