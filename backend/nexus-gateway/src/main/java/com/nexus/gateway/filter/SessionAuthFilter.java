package com.nexus.gateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpCookie;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
public class SessionAuthFilter implements GlobalFilter, Ordered {

    private final StringRedisTemplate redisTemplate;

    private static final List<String> WHITE_LIST = List.of(
            "/api/v1/auth/login",
            "/api/v1/auth/register"
    );

    public SessionAuthFilter(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getPath().value();

        if (WHITE_LIST.stream().anyMatch(path::startsWith)) {
            return chain.filter(exchange);
        }

        HttpCookie sessionCookie = request.getCookies().getFirst("SESSION");
        if (sessionCookie == null) {
            exchange.getResponse().setStatusCode(org.springframework.http.HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        String sessionId = sessionCookie.getValue();
        String sessionKey = "spring:session:NexusTools:SESSION:" + sessionId;

        String userId = redisTemplate.opsForValue().get(sessionKey + ":userId");
        if (userId == null) {
            exchange.getResponse().setStatusCode(org.springframework.http.HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        ServerHttpRequest mutatedRequest = request.mutate()
                .header("X-User-Id", userId)
                .build();

        return chain.filter(exchange.mutate().request(mutatedRequest).build());
    }

    @Override
    public int getOrder() {
        return -100;
    }
}