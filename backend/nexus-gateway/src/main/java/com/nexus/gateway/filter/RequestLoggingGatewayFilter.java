package com.nexus.gateway.filter;

import lombok.extern.slf4j.Slf4j;
import org.apache.skywalking.apm.toolkit.webflux.WebFluxSkyWalkingTraceContext;
import org.slf4j.MDC;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Gateway 请求日志过滤器（GlobalFilter）
 * - 记录请求/响应信息
 * - 计算请求耗时
 * - TraceId 写入 MDC，让 logback 的 %tid 自动填入
 */
@Slf4j
@Component
public class RequestLoggingGatewayFilter implements GlobalFilter, Ordered {

    private static final String TRACE_ID_KEY = "tid";
    private static final String[] EXCLUDED_PATHS = {"/actuator", "/health", "/favicon"};

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getPath().value();

        if (isExcludedPath(path)) {
            return chain.filter(exchange);
        }

        long startTime = System.currentTimeMillis();

        return chain.filter(exchange)
                .doOnEach(signal -> {
                    // 在每个信号时将 traceId 写入 MDC
                    String traceId = WebFluxSkyWalkingTraceContext.traceId(exchange);
                    if (traceId != null && !traceId.equals("N/A")) {
                        MDC.put(TRACE_ID_KEY, traceId);
                    }
                })
                .doFinally(signalType -> {
                    long duration = System.currentTimeMillis() - startTime;
                    ServerHttpResponse response = exchange.getResponse();
                    String traceId = WebFluxSkyWalkingTraceContext.traceId(exchange);

                    // 确保 MDC 中有 traceId
                    if (traceId != null && !traceId.equals("N/A")) {
                        MDC.put(TRACE_ID_KEY, traceId);
                    }

                    logRequest(request, response, duration);

                    // 清理 MDC
                    MDC.remove(TRACE_ID_KEY);
                });
    }

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE;
    }

    private boolean isExcludedPath(String path) {
        for (String excluded : EXCLUDED_PATHS) {
            if (path.contains(excluded)) {
                return true;
            }
        }
        return false;
    }

    private void logRequest(ServerHttpRequest request, ServerHttpResponse response, long duration) {
        String method = request.getMethod().name();
        String uri = request.getPath().value();
        String clientIp = getClientIp(request);
        int status = response.getStatusCode() != null ? response.getStatusCode().value() : 0;

        // traceId 由 MDC 自动注入 (%tid)
        if (status >= 400) {
            log.warn("{} {} {} - {}ms | Status: {}", clientIp, method, uri, duration, status);
        } else {
            log.info("{} {} {} - {}ms | Status: {}", clientIp, method, uri, duration, status);
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