package com.nexus.common.support;

import com.nexus.common.constants.ResultCode;
import com.nexus.common.exception.BusinessException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ResourceAccessCheckerTest {

    @Test
    void returnsEntityWhenOwned() {
        String entity = "ok";
        assertSame(entity, ResourceAccessChecker.requireOwned(entity, e -> true, "记录"));
    }

    @Test
    void throwsNotFoundWhenMissing() {
        BusinessException ex = assertThrows(
            BusinessException.class,
            () -> ResourceAccessChecker.requireOwned(null, e -> true, "记录")
        );
        assertEquals(ResultCode.NOT_FOUND, ex.getCode());
    }

    @Test
    void throwsForbiddenWhenNotOwned() {
        BusinessException ex = assertThrows(
            BusinessException.class,
            () -> ResourceAccessChecker.requireOwned("x", e -> false, "记录")
        );
        assertEquals(ResultCode.FORBIDDEN, ex.getCode());
    }
}
