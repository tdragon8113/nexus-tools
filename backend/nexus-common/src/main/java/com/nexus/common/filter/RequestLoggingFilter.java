package com.nexus.common.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;

/**
 * 请求日志过滤器
 * - 记录请求/响应信息
 * - 计算请求耗时
 * - TraceId 由 Micrometer Tracing 自动注入 MDC
 */
@Slf4j
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final String[] EXCLUDED_PATHS = {"/actuator", "/health", "/favicon"};

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();
        if (isExcludedPath(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(request);
        ContentCachingResponseWrapper wrappedResponse = new ContentCachingResponseWrapper(response);

        long startTime = System.currentTimeMillis();

        try {
            filterChain.doFilter(wrappedRequest, wrappedResponse);
        } finally {
            long duration = System.currentTimeMillis() - startTime;

            // TraceId 由 Micrometer Tracing 自动注入 MDC，无需手动设置
            String traceId = MDC.get("traceId");
            logRequest(wrappedRequest, wrappedResponse, duration, traceId);

            wrappedResponse.copyBodyToResponse();
        }
    }

    private boolean isExcludedPath(String path) {
        for (String excluded : EXCLUDED_PATHS) {
            if (path.contains(excluded)) {
                return true;
            }
        }
        return false;
    }

    private void logRequest(ContentCachingRequestWrapper request,
                            ContentCachingResponseWrapper response,
                            long duration, String traceId) {

        String method = request.getMethod();
        String uri = request.getRequestURI();
        String clientIp = getClientIp(request);
        int status = response.getStatus();

        String requestBody = getRequestBody(request);
        String responseBody = getResponseBody(response);

        if (status >= 400) {
            log.warn("[{}] {} {} {} - {}ms | Status: {} | Req: {} | Res: {}",
                    traceId != null ? traceId : "NO_TRACE",
                    clientIp, method, uri, duration, status,
                    truncate(requestBody, 500), truncate(responseBody, 500));
        } else {
            log.info("[{}] {} {} {} - {}ms | Status: {}",
                    traceId != null ? traceId : "NO_TRACE",
                    clientIp, method, uri, duration, status);
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }

    private String getRequestBody(ContentCachingRequestWrapper request) {
        try {
            byte[] content = request.getContentAsByteArray();
            if (content.length > 0) {
                return new String(content, request.getCharacterEncoding());
            }
        } catch (Exception e) {
            log.debug("Failed to read request body: {}", e.getMessage());
        }
        return "";
    }

    private String getResponseBody(ContentCachingResponseWrapper response) {
        try {
            byte[] content = response.getContentAsByteArray();
            if (content.length > 0) {
                return new String(content, response.getCharacterEncoding());
            }
        } catch (Exception e) {
            log.debug("Failed to read response body: {}", e.getMessage());
        }
        return "";
    }

    private String truncate(String str, int maxLength) {
        if (str == null || str.length() <= maxLength) {
            return str;
        }
        return str.substring(0, maxLength) + "...";
    }
}