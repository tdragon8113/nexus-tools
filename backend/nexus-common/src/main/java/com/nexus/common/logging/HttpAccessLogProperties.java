package com.nexus.common.logging;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@Data
@ConfigurationProperties(prefix = "nexus.http-access-log")
public class HttpAccessLogProperties {

    /** 是否记录请求/响应参数（body）；query 始终合并在 uri 中 */
    private boolean logPayload = true;

    /** 单段 payload 最大字符数，超出截断 */
    private int maxPayloadLength = 2048;

    /** JSON 字段名（忽略大小写）命中则脱敏 */
    private List<String> sensitiveKeys = List.of(
            "password",
            "passwd",
            "secret",
            "token",
            "accessToken",
            "refreshToken",
            "authorization",
            "apiKey",
            "api_key"
    );
}
