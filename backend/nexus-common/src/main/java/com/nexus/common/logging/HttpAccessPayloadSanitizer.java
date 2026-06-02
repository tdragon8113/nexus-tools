package com.nexus.common.logging;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

/** 访问日志 payload：压成单行并截断。 */
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class HttpAccessPayloadSanitizer {

    public static String sanitize(String raw) {
        if (raw == null || raw.isBlank()) {
            return "-";
        }
        String normalized = raw.replace('\r', ' ').replace('\n', ' ').trim();
        int maxLength = HttpAccessLogProperties.getMaxPayloadLength();
        if (normalized.length() <= maxLength) {
            return normalized;
        }
        return normalized.substring(0, maxLength) + "...";
    }
}
