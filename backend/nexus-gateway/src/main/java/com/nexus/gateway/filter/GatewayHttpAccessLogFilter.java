package com.nexus.gateway.filter;

import com.nexus.common.logging.HttpAccessLogSupport;
import io.micrometer.tracing.Tracer;
import lombok.RequiredArgsConstructor;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/** Gateway HTTP 访问日志，格式见 {@link HttpAccessLogSupport}。 */
@Component
@RequiredArgsConstructor
public class GatewayHttpAccessLogFilter implements GlobalFilter, Ordered {

    private final Tracer tracer;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        if (HttpAccessLogSupport.isExcludedPath(request.getPath().value())) {
            return chain.filter(exchange);
        }

        HttpAccessLogSupport.stashTraceId(tracer, exchange.getAttributes());
        long startTime = System.nanoTime();

        return chain.filter(exchange).doFinally(signal -> {
            int status = exchange.getResponse().getStatusCode() != null
                    ? exchange.getResponse().getStatusCode().value()
                    : 0;
            long durationMs = (System.nanoTime() - startTime) / 1_000_000;
            String remote = request.getRemoteAddress() != null
                    ? request.getRemoteAddress().getAddress().getHostAddress()
                    : null;

            HttpAccessLogSupport.write(
                    HttpAccessLogSupport.resolveTraceId(tracer, exchange.getAttributes()),
                    HttpAccessLogSupport.resolveClientIp(
                            request.getHeaders().getFirst("X-Forwarded-For"),
                            request.getHeaders().getFirst("X-Real-IP"),
                            remote),
                    request.getMethod().name(),
                    HttpAccessLogSupport.buildUri(
                            request.getURI().getRawPath(),
                            request.getURI().getRawQuery()),
                    status,
                    durationMs);
        });
    }

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE;
    }
}
