package com.nexus.common.logging;

import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;

/** 从 Servlet 缓存包装器读取请求/响应 body。 */
public final class HttpAccessPayloadReader {

    private HttpAccessPayloadReader() {
    }

    public static String readRequest(ContentCachingRequestWrapper request) {
        if (!HttpAccessLogProperties.isLogPayload()) {
            return "-";
        }
        byte[] content = request.getContentAsByteArray();
        if (content.length == 0) {
            return "-";
        }
        return HttpAccessPayloadSanitizer.sanitize(decode(content, request.getCharacterEncoding()));
    }

    public static String readResponse(ContentCachingResponseWrapper response) {
        if (!HttpAccessLogProperties.isLogPayload()) {
            return "-";
        }
        byte[] content = response.getContentAsByteArray();
        if (content.length == 0) {
            return "-";
        }
        return HttpAccessPayloadSanitizer.sanitize(decode(content, response.getCharacterEncoding()));
    }

    private static String decode(byte[] content, String encoding) {
        Charset charset;
        try {
            charset = encoding != null ? Charset.forName(encoding) : StandardCharsets.UTF_8;
        } catch (Exception e) {
            charset = StandardCharsets.UTF_8;
        }
        return new String(content, charset);
    }
}
