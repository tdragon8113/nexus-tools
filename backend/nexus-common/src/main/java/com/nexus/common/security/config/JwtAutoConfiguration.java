package com.nexus.common.security.config;

import com.nexus.common.security.JwtUtils;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;

/**
 * JWT 自动配置
 * 在所有类型应用中生效（Servlet 和 WebFlux）
 */
@AutoConfiguration
@ConditionalOnProperty(name = "jwt.secret-key")
public class JwtAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public JwtUtils jwtUtils(
            org.springframework.core.env.Environment environment) {
        String secretKey = environment.getProperty("jwt.secret-key");
        long expiration = environment.getProperty("jwt.access-token-expiration", Long.class, 900L);
        return new JwtUtils(secretKey, expiration);
    }
}