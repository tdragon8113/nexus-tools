package com.nexus.common.config;

import com.nexus.common.filter.RequestLoggingFilter;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 日志自动配置（仅 Servlet 应用）
 * WebFlux 应用（如 Gateway）不支持 jakarta.servlet.Filter
 */
@Configuration
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
public class LoggingAutoConfiguration {

    @Bean
    public RequestLoggingFilter requestLoggingFilter() {
        return new RequestLoggingFilter();
    }
}