package com.nexus.common.config;

import com.nexus.common.filter.HttpAccessLogFilter;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
public class HttpAccessLogAutoConfiguration {

    @Bean
    public HttpAccessLogFilter httpAccessLogFilter() {
        return new HttpAccessLogFilter();
    }
}
