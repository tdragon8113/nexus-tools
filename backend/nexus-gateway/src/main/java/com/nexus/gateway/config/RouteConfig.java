package com.nexus.gateway.config;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RouteConfig {

    @Bean
    public RouteLocator customRoutes(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("user-service", r -> r
                        .path("/api/v1/auth/**", "/api/v1/user/**")
                        .filters(f -> f.stripPrefix(2))
                        .uri("lb://nexus-user-service"))
                .route("workspace-service", r -> r
                        .path("/api/v1/todo/**", "/api/v1/activity/**", "/api/v1/sync/**", "/api/v1/report/**")
                        .filters(f -> f.stripPrefix(2))
                        .uri("lb://nexus-workspace-service"))
                .build();
    }
}