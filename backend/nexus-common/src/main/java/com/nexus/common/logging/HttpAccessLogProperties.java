package com.nexus.common.logging;

/** HTTP 访问日志固定配置（payload 默认记录，单段最长 2048 字符）。 */
public final class HttpAccessLogProperties {

    private static final boolean LOG_PAYLOAD = true;
    private static final int MAX_PAYLOAD_LENGTH = 2048;

    private HttpAccessLogProperties() {
    }

    public static boolean isLogPayload() {
        return LOG_PAYLOAD;
    }

    public static int getMaxPayloadLength() {
        return MAX_PAYLOAD_LENGTH;
    }
}
