package com.nexus.common.filter;

import com.nexus.common.logging.HttpAccessLogSupport;
import io.micrometer.tracing.Tracer;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/** Servlet HTTP 访问日志，格式见 {@link HttpAccessLogSupport}。 */
@RequiredArgsConstructor
public class HttpAccessLogFilter extends OncePerRequestFilter {

    private final Tracer tracer;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();
        if (HttpAccessLogSupport.isExcludedPath(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        long startTime = System.nanoTime();
        try {
            filterChain.doFilter(request, response);
        } finally {
            long durationMs = (System.nanoTime() - startTime) / 1_000_000;
            HttpAccessLogSupport.write(
                    HttpAccessLogSupport.traceId(tracer),
                    HttpAccessLogSupport.resolveClientIp(
                            request.getHeader("X-Forwarded-For"),
                            request.getHeader("X-Real-IP"),
                            request.getRemoteAddr()),
                    request.getMethod(),
                    HttpAccessLogSupport.buildUri(request.getRequestURI(), request.getQueryString()),
                    response.getStatus(),
                    durationMs);
        }
    }
}
