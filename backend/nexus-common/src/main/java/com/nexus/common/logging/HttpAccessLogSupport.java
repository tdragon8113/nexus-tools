package com.nexus.common.logging;

import io.micrometer.tracing.Span;
import io.micrometer.tracing.Tracer;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;

import java.util.Map;

/** HTTP 访问日志：路径/IP/trace 解析与 logfmt 输出。 */
@Slf4j
public final class HttpAccessLogSupport {

    public static final String TRACE_ID_ATTR = "access.traceId";

    private static final String LOG_TEMPLATE =
            "clientIp={} method={} uri={} status={} durationMs={} req={} res={}";

    private HttpAccessLogSupport() {
    }

    public static String buildUri(String path, String query) {
        return query == null || query.isBlank() ? path : path + "?" + query;
    }

    public static String resolveClientIp(String xForwardedFor, String xRealIp, String remoteAddr) {
        String ip = xForwardedFor;
        if (ip == null || ip.isBlank()) {
            ip = xRealIp;
        }
        if (ip == null || ip.isBlank()) {
            ip = remoteAddr;
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip != null && !ip.isBlank() ? ip : "-";
    }

    public static String traceId(Tracer tracer) {
        Span span = tracer.currentSpan();
        return span != null ? span.context().traceId() : "-";
    }

    public static void stashTraceId(Tracer tracer, Map<String, Object> attributes) {
        Span span = tracer.currentSpan();
        if (span != null) {
            attributes.put(TRACE_ID_ATTR, span.context().traceId());
        }
    }

    public static String resolveTraceId(Tracer tracer, Map<String, Object> attributes) {
        Object id = attributes.get(TRACE_ID_ATTR);
        if (id != null) {
            return id.toString();
        }
        return traceId(tracer);
    }

    public static void logAccess(String clientIp, String method, String uri, int status,
                                 long durationMs, String reqPayload, String resPayload) {
        if (status >= 500) {
            log.error(LOG_TEMPLATE, clientIp, method, uri, status, durationMs, reqPayload, resPayload);
        } else if (status >= 400) {
            log.warn(LOG_TEMPLATE, clientIp, method, uri, status, durationMs, reqPayload, resPayload);
        } else {
            log.info(LOG_TEMPLATE, clientIp, method, uri, status, durationMs, reqPayload, resPayload);
        }
    }

    /** Gateway doFinally 时 MDC 可能无 traceId，先从 exchange 恢复再写日志。 */
    public static void logAccess(Tracer tracer, Map<String, Object> attributes,
                                 String xForwardedFor, String xRealIp, String remoteAddr,
                                 String method, String path, String query, int status,
                                 long durationMs, String reqPayload, String resPayload) {
        String traceId = resolveTraceId(tracer, attributes);
        if (!"-".equals(traceId)) {
            MDC.put("traceId", traceId);
        }
        try {
            logAccess(
                    resolveClientIp(xForwardedFor, xRealIp, remoteAddr),
                    method,
                    buildUri(path, query),
                    status,
                    durationMs,
                    reqPayload,
                    resPayload);
        } finally {
            MDC.remove("traceId");
        }
    }
}
