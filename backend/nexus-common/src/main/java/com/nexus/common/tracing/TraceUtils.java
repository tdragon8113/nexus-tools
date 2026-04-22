package com.nexus.common.tracing;

import io.micrometer.tracing.Span;
import io.micrometer.tracing.Tracer;

/**
 * Tracing 工具类（手动创建 Span）
 */
public class TraceUtils {

    private final Tracer tracer;

    public TraceUtils(Tracer tracer) {
        this.tracer = tracer;
    }

    /**
     * 获取当前 Span
     */
    public Span currentSpan() {
        return tracer.currentSpan();
    }

    /**
     * 获取当前 traceId
     */
    public String currentTraceId() {
        Span span = tracer.currentSpan();
        return span != null ? span.context().traceId() : null;
    }

    /**
     * 创建新的 Span
     */
    public Span startSpan(String name) {
        return tracer.spanBuilder().name(name).start();
    }

    /**
     * 在 Span 中执行操作
     */
    public <T> T withSpan(String name, SpanSupplier<T> supplier) {
        Span span = startSpan(name);
        try (Tracer.SpanInScope scope = tracer.withSpan(span)) {
            return supplier.get();
        } finally {
            span.end();
        }
    }

    /**
     * 在 Span 中执行操作（无返回值）
     */
    public void withSpan(String name, SpanRunnable runnable) {
        Span span = startSpan(name);
        try (Tracer.SpanInScope scope = tracer.withSpan(span)) {
            runnable.run();
        } finally {
            span.end();
        }
    }

    /**
     * 为当前 Span 添加标签
     */
    public void tag(String key, String value) {
        Span span = tracer.currentSpan();
        if (span != null) {
            span.tag(key, value);
        }
    }

    /**
     * 为当前 Span 添加事件
     */
    public void event(String name) {
        Span span = tracer.currentSpan();
        if (span != null) {
            span.event(name);
        }
    }

    /**
     * 记录错误
     */
    public void error(Throwable throwable) {
        Span span = tracer.currentSpan();
        if (span != null) {
            span.error(throwable);
        }
    }

    @FunctionalInterface
    public interface SpanSupplier<T> {
        T get();
    }

    @FunctionalInterface
    public interface SpanRunnable {
        void run();
    }
}