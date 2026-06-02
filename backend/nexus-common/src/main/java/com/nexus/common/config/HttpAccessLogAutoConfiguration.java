package com.nexus.common.config;

import com.nexus.common.filter.HttpAccessLogFilter;
import com.nexus.common.logging.HttpAccessLogProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
@EnableConfigurationProperties(HttpAccessLogProperties.class)
public class HttpAccessLogAutoConfiguration {

    @Bean
    public HttpAccessLogFilter httpAccessLogFilter(HttpAccessLogProperties properties) {
        return new HttpAccessLogFilter(properties);
    }
}
