package com.nexus.workspace.domain.model.reflection;

public enum ReflectionScope {
    day,
    month,
    year;

    public static ReflectionScope fromString(String value) {
        if (value == null) {
            return day;
        }
        return switch (value.toLowerCase()) {
            case "month" -> month;
            case "year" -> year;
            default -> day;
        };
    }
}
