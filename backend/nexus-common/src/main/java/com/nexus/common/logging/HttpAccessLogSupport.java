package com.nexus.common.logging;

import io.micrometer.tracing.Span;
import io.micrometer.tracing.Tracer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

/**
 * HTTP 访问日志（logfmt）共用逻辑：字段、级别、排除路径、clientIp / traceId 解析。
 */
public final class HttpAccessLogSupport {

    public static final Logger LOGGER = LoggerFactory.getLogger("http.access");
    public static final String TRACE_ID_ATTR = "http.access.traceId";

    private static final String LOG_TEMPLATE =
            "event=http.access traceId={} clientIp={} method={} uri={} status={} durationMs={}";
    private static final String[] EXCLUDED_PATHS = {"/actuator", "/health", "/favicon"};

    private HttpAccessLogSupport() {
    }

    public static boolean isExcludedPath(String path) {
        for (String excluded : EXCLUDED_PATHS) {
            if (path.contains(excluded)) {
                return true;
            }
        }
        return false;
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

    public static void write(String traceId, String clientIp, String method, String uri,
                             int status, long durationMs) {
        if (status >= 500) {
            LOGGER.error(LOG_TEMPLATE, traceId, clientIp, method, uri, status, durationMs);
        } else if (status >= 400) {
            LOGGER.warn(LOG_TEMPLATE, traceId, clientIp, method, uri, status, durationMs);
        } else {
            LOGGER.info(LOG_TEMPLATE, traceId, clientIp, method, uri, status, durationMs);
        }
    }
}
