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
        return HttpAccessPayloadSanitizer.sanitize(decodeResponse(content, response));
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

    /** JSON 响应体为 UTF-8 字节，但 Servlet 默认 encoding 常为 ISO-8859-1，需与 Gateway 一致用 UTF-8 解码。 */
    private static String decodeResponse(byte[] content, ContentCachingResponseWrapper response) {
        Charset charset = charsetFromContentType(response.getContentType());
        if (charset == null) {
            charset = charsetForJsonBody(response.getCharacterEncoding());
        }
        return new String(content, charset);
    }

    private static Charset charsetFromContentType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return null;
        }
        for (String part : contentType.split(";")) {
            String trimmed = part.trim();
            if (trimmed.regionMatches(true, 0, "charset=", 0, "charset=".length())) {
                try {
                    return Charset.forName(trimmed.substring("charset=".length()).trim());
                } catch (Exception ignored) {
                    return null;
                }
            }
        }
        return null;
    }

    private static Charset charsetForJsonBody(String encoding) {
        if (encoding == null || encoding.isBlank() || "ISO-8859-1".equalsIgnoreCase(encoding)) {
            return StandardCharsets.UTF_8;
        }
        try {
            return Charset.forName(encoding);
        } catch (Exception e) {
            return StandardCharsets.UTF_8;
        }
    }
}
