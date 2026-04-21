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
import java.util.UUID;

/**
 * 请求日志过滤器
 * - 生成 TraceId
 * - 记录请求/响应信息
 * - 计算请求耗时
 */
@Slf4j
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final String TRACE_ID = "traceId";
    private static final String[] EXCLUDED_PATHS = {"/actuator", "/health", "/favicon"};

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // 排除健康检查等路径
        String path = request.getRequestURI();
        if (isExcludedPath(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        // 生成 TraceId
        String traceId = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        MDC.put(TRACE_ID, traceId);

        // 包装 request/response 以缓存内容
        ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(request);
        ContentCachingResponseWrapper wrappedResponse = new ContentCachingResponseWrapper(response);

        long startTime = System.currentTimeMillis();

        try {
            filterChain.doFilter(wrappedRequest, wrappedResponse);
        } finally {
            long duration = System.currentTimeMillis() - startTime;

            // 记录请求日志
            logRequest(wrappedRequest, wrappedResponse, duration, traceId);

            // 必须复制响应内容回原始 response
            wrappedResponse.copyBodyToResponse();

            MDC.remove(TRACE_ID);
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

        // 获取请求体（限制长度）
        String requestBody = getRequestBody(request);
        // 获取响应体（限制长度）
        String responseBody = getResponseBody(response);

        // 根据状态码选择日志级别
        if (status >= 400) {
            log.warn("[{}] {} {} {} - {}ms | Status: {} | Req: {} | Res: {}",
                    traceId, clientIp, method, uri, duration, status,
                    truncate(requestBody, 500), truncate(responseBody, 500));
        } else {
            log.info("[{}] {} {} {} - {}ms | Status: {}",
                    traceId, clientIp, method, uri, duration, status);
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
        // 多级代理时取第一个 IP
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