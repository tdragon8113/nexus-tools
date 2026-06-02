package com.nexus.gateway.filter;

import com.nexus.common.logging.HttpAccessLogProperties;
import com.nexus.common.logging.HttpAccessLogSupport;
import com.nexus.common.logging.HttpAccessPayloadSanitizer;
import io.micrometer.tracing.Tracer;
import lombok.RequiredArgsConstructor;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpRequestDecorator;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.http.server.reactive.ServerHttpResponseDecorator;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/** Gateway HTTP 访问日志（含脱敏后的 req/res 参数）。 */
@Component
@RequiredArgsConstructor
public class GatewayHttpAccessLogFilter implements GlobalFilter, Ordered {

    private static final String REQ_BODY_ATTR = "access.reqBodyBytes";

    private final Tracer tracer;
    private final HttpAccessLogProperties properties;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        HttpAccessLogSupport.stashTraceId(tracer, exchange.getAttributes());
        long startTime = System.nanoTime();

        if (!properties.isLogPayload()) {
            return chain.filter(exchange)
                    .doFinally(signal -> logAccess(exchange, request, startTime, "-", "-"));
        }

        return DataBufferUtils.join(request.getBody())
                .defaultIfEmpty(exchange.getResponse().bufferFactory().allocateBuffer(0))
                .flatMap(joined -> {
                    byte[] reqBytes = toByteArray(joined);
                    DataBufferUtils.release(joined);
                    exchange.getAttributes().put(REQ_BODY_ATTR, reqBytes);

                    ServerHttpRequest decoratedRequest = new ServerHttpRequestDecorator(request) {
                        @Override
                        public Flux<DataBuffer> getBody() {
                            if (reqBytes.length == 0) {
                                return Flux.empty();
                            }
                            return Flux.just(exchange.getResponse().bufferFactory().wrap(reqBytes));
                        }
                    };

                    List<byte[]> responseChunks = new ArrayList<>();
                    ServerHttpResponseDecorator decoratedResponse = new ServerHttpResponseDecorator(exchange.getResponse()) {
                        @Override
                        public Mono<Void> writeWith(org.reactivestreams.Publisher<? extends DataBuffer> body) {
                            return super.writeWith(Flux.from(body).map(buffer -> {
                                byte[] bytes = toByteArray(buffer);
                                DataBufferUtils.release(buffer);
                                responseChunks.add(bytes);
                                return exchange.getResponse().bufferFactory().wrap(bytes);
                            }));
                        }
                    };

                    return chain.filter(exchange.mutate()
                                    .request(decoratedRequest)
                                    .response(decoratedResponse)
                                    .build())
                            .doFinally(signal -> {
                                String reqPayload = sanitizeBytes(reqBytes);
                                String resPayload = sanitizeBytes(concat(responseChunks));
                                logAccess(exchange, request, startTime, reqPayload, resPayload);
                            });
                });
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 10;
    }

    private void logAccess(ServerWebExchange exchange, ServerHttpRequest request, long startTime,
                           String reqPayload, String resPayload) {
        int status = exchange.getResponse().getStatusCode() != null
                ? exchange.getResponse().getStatusCode().value()
                : 0;
        long durationMs = (System.nanoTime() - startTime) / 1_000_000;
        String remote = request.getRemoteAddress() != null
                ? request.getRemoteAddress().getAddress().getHostAddress()
                : null;

        HttpAccessLogSupport.logAccess(
                tracer,
                exchange.getAttributes(),
                request.getHeaders().getFirst("X-Forwarded-For"),
                request.getHeaders().getFirst("X-Real-IP"),
                remote,
                request.getMethod().name(),
                request.getURI().getRawPath(),
                request.getURI().getRawQuery(),
                status,
                durationMs,
                reqPayload,
                resPayload);
    }

    private String sanitizeBytes(byte[] bytes) {
        if (bytes == null || bytes.length == 0) {
            return "-";
        }
        String raw = new String(bytes, StandardCharsets.UTF_8);
        return HttpAccessPayloadSanitizer.sanitize(raw, properties);
    }

    private static byte[] toByteArray(DataBuffer buffer) {
        byte[] bytes = new byte[buffer.readableByteCount()];
        buffer.read(bytes);
        return bytes;
    }

    private static byte[] concat(List<byte[]> chunks) {
        if (chunks.isEmpty()) {
            return new byte[0];
        }
        int total = 0;
        for (byte[] chunk : chunks) {
            total += chunk.length;
        }
        byte[] all = new byte[total];
        int offset = 0;
        for (byte[] chunk : chunks) {
            System.arraycopy(chunk, 0, all, offset, chunk.length);
            offset += chunk.length;
        }
        return all;
    }
}
