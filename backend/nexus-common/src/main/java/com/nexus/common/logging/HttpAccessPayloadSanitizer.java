package com.nexus.common.logging;

import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;

import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/** 访问日志 payload：脱敏 + 截断 + 压成单行。 */
public final class HttpAccessPayloadSanitizer {

    private static final String REDACTED = "***";

    private HttpAccessPayloadSanitizer() {
    }

    public static String sanitize(String raw, HttpAccessLogProperties properties) {
        if (StrUtil.isBlank(raw)) {
            return "-";
        }
        String normalized = raw.replace('\r', ' ').replace('\n', ' ').trim();
        if (properties.isLogPayload() && JSONUtil.isTypeJSON(normalized)) {
            normalized = maskJson(normalized, properties);
        }
        return truncate(normalized, properties.getMaxPayloadLength());
    }

    private static String maskJson(String json, HttpAccessLogProperties properties) {
        Set<String> sensitive = properties.getSensitiveKeys().stream()
                .map(key -> key.toLowerCase(Locale.ROOT))
                .collect(Collectors.toSet());
        try {
            if (JSONUtil.isTypeJSONObject(json)) {
                return maskObject(JSONUtil.parseObj(json), sensitive).toString();
            }
            if (JSONUtil.isTypeJSONArray(json)) {
                JSONArray array = JSONUtil.parseArray(json);
                for (int i = 0; i < array.size(); i++) {
                    Object element = array.get(i);
                    if (element instanceof JSONObject obj) {
                        array.set(i, maskObject(obj, sensitive));
                    }
                }
                return array.toString();
            }
        } catch (Exception ignored) {
            // 非标准 JSON，按原文记录（已截断）
        }
        return json;
    }

    private static JSONObject maskObject(JSONObject object, Set<String> sensitive) {
        JSONObject copy = new JSONObject(object);
        for (String key : copy.keySet()) {
            if (sensitive.contains(key.toLowerCase(Locale.ROOT))) {
                copy.set(key, REDACTED);
            } else {
                Object value = copy.get(key);
                if (value instanceof JSONObject nested) {
                    copy.set(key, maskObject(nested, sensitive));
                }
            }
        }
        return copy;
    }

    private static String truncate(String value, int maxLength) {
        if (value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength) + "...";
    }
}
