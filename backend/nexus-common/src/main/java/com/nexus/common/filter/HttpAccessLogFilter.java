package com.nexus.common.filter;

import com.nexus.common.logging.HttpAccessLogSupport;
import com.nexus.common.logging.HttpAccessPayloadReader;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;

/** Servlet HTTP 访问日志（含 req/res body，单行截断）。 */
public class HttpAccessLogFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(request);
        ContentCachingResponseWrapper wrappedResponse = new ContentCachingResponseWrapper(response);
        long startTime = System.nanoTime();

        try {
            filterChain.doFilter(wrappedRequest, wrappedResponse);
        } finally {
            long durationMs = (System.nanoTime() - startTime) / 1_000_000;
            HttpAccessLogSupport.logAccess(
                    HttpAccessLogSupport.resolveClientIp(
                            request.getHeader("X-Forwarded-For"),
                            request.getHeader("X-Real-IP"),
                            request.getRemoteAddr()),
                    request.getMethod(),
                    HttpAccessLogSupport.buildUri(request.getRequestURI(), request.getQueryString()),
                    wrappedResponse.getStatus(),
                    durationMs,
                    HttpAccessPayloadReader.readRequest(wrappedRequest),
                    HttpAccessPayloadReader.readResponse(wrappedResponse));
            wrappedResponse.copyBodyToResponse();
        }
    }
}
