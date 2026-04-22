package com.nexus.common.config;

import io.micrometer.tracing.Tracer;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;

/**
 * Micrometer Tracing 自动配置
 * Spring Boot 3.2+ 自动配置 tracing，这里只提供 TraceUtils Bean
 */
@AutoConfiguration
@ConditionalOnClass(Tracer.class)
@ConditionalOnProperty(name = "management.tracing.enabled", havingValue = "true", matchIfMissing = true)
public class TracingAutoConfiguration {

    @Bean
    public com.nexus.common.tracing.TraceUtils traceUtils(Tracer tracer) {
        return new com.nexus.common.tracing.TraceUtils(tracer);
    }
}