package com.nexus.common.config;

import com.nexus.common.filter.HttpAccessLogFilter;
import io.micrometer.tracing.Tracer;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
public class HttpAccessLogAutoConfiguration {

    @Bean
    public HttpAccessLogFilter httpAccessLogFilter(Tracer tracer) {
        return new HttpAccessLogFilter(tracer);
    }
}
