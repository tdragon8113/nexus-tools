package com.nexus.workspace.interfaces.dto.response;

import lombok.Data;

import java.util.List;

@Data
public class ActivityAnalyticsResponse {
    private StatsBounds bounds;
    private StatsMetrics metrics;
    private StatsMetrics previousMetrics;
    private Integer totalChange;
    private Integer avgChange;
    private Integer xpChange;
    private List<StatsCategoryBreakdown> categoryBreakdown;
    private List<StatsChartBucket> chartBuckets;
    private List<StatsDayMarker> dayMarkers;
    private int streak;
    private String insight;
    private String moodLabel;
    private String rangeLabel;

    @Data
    public static class StatsBounds {
        private String preset;
        private String label;
        private String previousLabel;
        private String startKey;
        private String endKey;
        private String previousStartKey;
        private String previousEndKey;
        private int dayCount;
    }

    @Data
    public static class StatsMetrics {
        private int totalMinutes;
        private int totalXp;
        private int recordDays;
        private int activityCount;
        private Double avgMood;
        private int avgDailyMinutes;
    }

    @Data
    public static class StatsCategoryBreakdown {
        private String category;
        private int minutes;
        private int previousMinutes;
        private Integer changePercent;
    }

    @Data
    public static class StatsChartBucket {
        private String id;
        private String label;
        private String subLabel;
        private int minutes;
        private List<CategoryMinutes> categories;
    }

    @Data
    public static class CategoryMinutes {
        private String category;
        private int minutes;
    }

    @Data
    public static class StatsDayMarker {
        private String dateKey;
        private String weekday;
        private String subLabel;
        private boolean hasRecord;
    }
}
