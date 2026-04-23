package com.nexus.common.config;

import com.nexus.common.filter.RequestLoggingWebFilter;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * WebFlux 日志自动配置（仅 Reactive 应用）
 * Servlet 应用使用 LoggingAutoConfiguration
 */
@Configuration
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.REACTIVE)
public class ReactiveLoggingAutoConfiguration {

    @Bean
    public RequestLoggingWebFilter requestLoggingWebFilter() {
        return new RequestLoggingWebFilter();
    }
}