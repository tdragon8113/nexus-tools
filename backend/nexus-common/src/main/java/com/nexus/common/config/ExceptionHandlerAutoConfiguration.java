package com.nexus.common.config;

import com.nexus.common.exception.GlobalExceptionHandler;
import org.springframework.context.annotation.Import;

@Import(GlobalExceptionHandler.class)
public class ExceptionHandlerAutoConfiguration {
}
