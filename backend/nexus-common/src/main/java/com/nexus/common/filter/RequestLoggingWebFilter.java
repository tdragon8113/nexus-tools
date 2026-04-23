package com.nexus.common.filter;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

/**
 * WebFlux 请求日志过滤器
 * - 记录请求/响应信息
 * - 计算请求耗时
 * - TraceId 由 Micrometer Tracing 自动注入 MDC
 */
@Slf4j
public class RequestLoggingWebFilter implements WebFilter {

    private static final String[] EXCLUDED_PATHS = {"/actuator", "/health", "/favicon"};

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getPath().value();

        if (isExcludedPath(path)) {
            return chain.filter(exchange);
        }

        long startTime = System.currentTimeMillis();

        return chain.filter(exchange)
                .doFinally(signalType -> {
                    long duration = System.currentTimeMillis() - startTime;
                    ServerHttpResponse response = exchange.getResponse();
                    String traceId = MDC.get("traceId");
                    logRequest(request, response, duration, traceId);
                });
    }

    private boolean isExcludedPath(String path) {
        for (String excluded : EXCLUDED_PATHS) {
            if (path.contains(excluded)) {
                return true;
            }
        }
        return false;
    }

    private void logRequest(ServerHttpRequest request, ServerHttpResponse response,
                            long duration, String traceId) {

        String method = request.getMethod().name();
        String uri = request.getPath().value();
        String clientIp = getClientIp(request);
        int status = response.getStatusCode() != null ? response.getStatusCode().value() : 0;

        if (status >= 400) {
            log.warn("[{}] {} {} {} - {}ms | Status: {}",
                    traceId != null ? traceId : "NO_TRACE",
                    clientIp, method, uri, duration, status);
        } else {
            log.info("[{}] {} {} {} - {}ms | Status: {}",
                    traceId != null ? traceId : "NO_TRACE",
                    clientIp, method, uri, duration, status);
        }
    }

    private String getClientIp(ServerHttpRequest request) {
        String ip = request.getHeaders().getFirst("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeaders().getFirst("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddress() != null
                    ? request.getRemoteAddress().getAddress().getHostAddress()
                    : "unknown";
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}