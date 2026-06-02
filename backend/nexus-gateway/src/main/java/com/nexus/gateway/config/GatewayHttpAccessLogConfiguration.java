package com.nexus.gateway.config;

import com.nexus.common.logging.HttpAccessLogProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(HttpAccessLogProperties.class)
public class GatewayHttpAccessLogConfiguration {
}
