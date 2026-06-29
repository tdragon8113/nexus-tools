package com.nexus.workspace.application.support;

import com.nexus.workspace.domain.model.activity.Activity;
import com.nexus.workspace.domain.model.category.UserActivityCategory;
import com.nexus.workspace.interfaces.dto.response.ActivityAnalyticsResponse;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public final class StatsDateUtils {

    public static final String SLEEP_CATEGORY_ID = "sleep";
    private static final int SLEEP_DAY_ROLLOVER_HOUR = 6;
    private static final DateTimeFormatter DATE_KEY = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final String[] WEEKDAYS = {"日", "一", "二", "三", "四", "五", "六"};
    public static final String[] MOOD_LABELS = {"很差", "一般", "还行", "不错", "很好"};

    private StatsDateUtils() {}

    public static String formatDateKey(LocalDate date) {
        return date.format(DATE_KEY);
    }

    public static LocalDate parseDateKey(String dateKey) {
        return LocalDate.parse(dateKey, DATE_KEY);
    }

    public static LocalDate addDays(LocalDate date, int days) {
        return date.plusDays(days);
    }

    public static List<Activity> filterActivitiesForStats(List<Activity> activities, boolean excludeSleep) {
        if (!excludeSleep) {
            return activities;
        }
        return activities.stream()
            .filter(item -> !SLEEP_CATEGORY_ID.equals(item.getCategory()))
            .toList();
    }

    public static LocalDateTime getActivityStartAt(Activity activity) {
        if (activity.getStartTime() != null) {
            return activity.getStartTime();
        }
        LocalDateTime end = activity.getEndTime() != null ? activity.getEndTime() : activity.getCreatedAt();
        if (end == null) {
            return LocalDateTime.now();
        }
        int duration = activity.getDurationMinutes() != null
            ? activity.getDurationMinutes()
            : activity.calculateDuration();
        return end.minusMinutes(duration);
    }

    public static boolean isSleepCategory(String categoryId, List<UserActivityCategory> categories) {
        if (SLEEP_CATEGORY_ID.equals(categoryId)) {
            return true;
        }
        return categories.stream()
            .filter(item -> categoryId.equals(item.getSlug()))
            .findFirst()
            .map(item -> "睡觉".equals(item.getLabel()))
            .orElse(false);
    }

    public static UserActivityCategory getCategoryMeta(
        List<UserActivityCategory> categories,
        String categoryId
    ) {
        return categories.stream()
            .filter(item -> categoryId.equals(item.getSlug()))
            .findFirst()
            .orElseGet(() -> {
                UserActivityCategory fallback = new UserActivityCategory();
                fallback.setSlug(categoryId);
                fallback.setLabel("未知类型");
                fallback.setEmoji("❓");
                fallback.setXpPerHour(15);
                return fallback;
            });
    }

    public static String getActivityAttributionDateKey(
        Activity activity,
        List<UserActivityCategory> categories
    ) {
        LocalDateTime startAt = getActivityStartAt(activity);
        LocalDate startDate = startAt.toLocalDate();

        if (isSleepCategory(activity.getCategory(), categories)) {
            if (startAt.getHour() < SLEEP_DAY_ROLLOVER_HOUR) {
                return formatDateKey(startDate.minusDays(1));
            }
            return formatDateKey(startDate);
        }

        return formatDateKey(startDate);
    }

    public static Integer calcStatsChangePercent(int current, int previous) {
        if (previous == 0) {
            return current > 0 ? 100 : null;
        }
        return Math.round(((current - previous) / (float) previous) * 100);
    }

    public static int countDaysInclusive(String startKey, String endKey) {
        int count = 0;
        LocalDate cursor = parseDateKey(startKey);

        while (true) {
            count += 1;
            if (formatDateKey(cursor).compareTo(endKey) >= 0) {
                break;
            }
            cursor = cursor.plusDays(1);
        }

        return count;
    }

    public static ActivityAnalyticsResponse.StatsBounds getStatsRangeBounds(
        String preset,
        String customStartKey,
        String customEndKey,
        LocalDateTime now
    ) {
        LocalDate today = now.toLocalDate();
        String endKey = formatDateKey(today);
        String normalizedPreset = preset != null ? preset : "week";

        if ("custom".equals(normalizedPreset)) {
            String customEnd = customEndKey != null && !customEndKey.isBlank()
                ? clampDateKeyToToday(customEndKey, endKey)
                : endKey;
            String customStart = customStartKey != null && !customStartKey.isBlank() ? customStartKey : customEnd;
            if (customStart.compareTo(customEnd) > 0) {
                String swapped = customStart;
                customStart = customEnd;
                customEnd = swapped;
            }
            return buildCustomBounds(customStart, customEnd);
        }

        return switch (normalizedPreset) {
            case "today" -> buildTodayBounds(endKey, today);
            case "yesterday" -> buildYesterdayBounds(today);
            case "week" -> buildWeekBounds(today, endKey);
            case "7d" -> buildRollingBounds("7d", "近 7 天", "前 7 天", today, endKey, 7);
            case "30d" -> buildRollingBounds("30d", "近 30 天", "前 30 天", today, endKey, 30);
            case "month" -> buildMonthBounds(today, endKey);
            default -> buildWeekBounds(today, endKey);
        };
    }

    public static ActivityAnalyticsResponse.StatsMetrics getPeriodMetrics(
        List<Activity> activities,
        List<UserActivityCategory> categories,
        String startKey,
        String endKey
    ) {
        List<Activity> periodActivities = activities.stream()
            .filter(item -> isActivityInDateRange(item, categories, startKey, endKey))
            .toList();

        int totalMinutes = periodActivities.stream()
            .mapToInt(item -> item.getDurationMinutes() != null ? item.getDurationMinutes() : item.calculateDuration())
            .sum();
        int totalXp = periodActivities.stream()
            .mapToInt(item -> item.getXp() != null ? item.getXp() : 0)
            .sum();
        Set<String> recordDaySet = new HashSet<>();
        for (Activity activity : periodActivities) {
            recordDaySet.add(getActivityAttributionDateKey(activity, categories));
        }
        int daySpan = countDaysInclusive(startKey, endKey);
        List<Integer> moodValues = periodActivities.stream()
            .map(Activity::getMood)
            .filter(mood -> mood != null)
            .toList();

        ActivityAnalyticsResponse.StatsMetrics metrics = new ActivityAnalyticsResponse.StatsMetrics();
        metrics.setTotalMinutes(totalMinutes);
        metrics.setTotalXp(totalXp);
        metrics.setRecordDays(recordDaySet.size());
        metrics.setActivityCount(periodActivities.size());
        metrics.setAvgMood(calculateAvgMood(moodValues));
        metrics.setAvgDailyMinutes(daySpan > 0 ? Math.round((float) totalMinutes / daySpan) : 0);
        return metrics;
    }

    public static List<ActivityAnalyticsResponse.StatsCategoryBreakdown> getPeriodCategoryBreakdown(
        List<Activity> activities,
        List<UserActivityCategory> categories,
        String startKey,
        String endKey,
        String previousStartKey,
        String previousEndKey
    ) {
        Map<String, Integer> currentTotals = new HashMap<>();
        Map<String, Integer> previousTotals = new HashMap<>();

        for (Activity activity : activities) {
            String day = getActivityAttributionDateKey(activity, categories);
            int duration = activity.getDurationMinutes() != null
                ? activity.getDurationMinutes()
                : activity.calculateDuration();
            if (day.compareTo(startKey) >= 0 && day.compareTo(endKey) <= 0) {
                currentTotals.merge(activity.getCategory(), duration, Integer::sum);
            }
            if (day.compareTo(previousStartKey) >= 0 && day.compareTo(previousEndKey) <= 0) {
                previousTotals.merge(activity.getCategory(), duration, Integer::sum);
            }
        }

        Set<String> categoryIds = new LinkedHashSet<>();
        categoryIds.addAll(currentTotals.keySet());
        categoryIds.addAll(previousTotals.keySet());
        categories.forEach(item -> categoryIds.add(item.getSlug()));

        List<ActivityAnalyticsResponse.StatsCategoryBreakdown> result = new ArrayList<>();
        for (String category : categoryIds) {
            int minutes = currentTotals.getOrDefault(category, 0);
            int previousMinutes = previousTotals.getOrDefault(category, 0);
            if (minutes <= 0 && previousMinutes <= 0) {
                continue;
            }
            ActivityAnalyticsResponse.StatsCategoryBreakdown breakdown =
                new ActivityAnalyticsResponse.StatsCategoryBreakdown();
            breakdown.setCategory(category);
            breakdown.setMinutes(minutes);
            breakdown.setPreviousMinutes(previousMinutes);
            breakdown.setChangePercent(calcStatsChangePercent(minutes, previousMinutes));
            result.add(breakdown);
        }

        result.sort(Comparator.comparingInt(ActivityAnalyticsResponse.StatsCategoryBreakdown::getMinutes).reversed());
        return result;
    }

    public static List<ActivityAnalyticsResponse.StatsChartBucket> getPeriodChartBuckets(
        List<Activity> activities,
        List<UserActivityCategory> categories,
        ActivityAnalyticsResponse.StatsBounds bounds
    ) {
        if (bounds.getDayCount() <= 7) {
            return buildDailyBuckets(activities, categories, bounds.getStartKey(), bounds.getEndKey());
        }
        if (bounds.getDayCount() <= 31) {
            int groupSize = Math.max(1, (int) Math.ceil(bounds.getDayCount() / 7.0));
            return buildGroupedBuckets(
                activities,
                categories,
                bounds.getStartKey(),
                bounds.getEndKey(),
                groupSize
            );
        }
        return buildGroupedBuckets(
            activities,
            categories,
            bounds.getStartKey(),
            bounds.getEndKey(),
            7
        );
    }

    public static List<ActivityAnalyticsResponse.StatsDayMarker> getPeriodDayMarkers(
        List<Activity> activities,
        List<UserActivityCategory> categories,
        String startKey,
        String endKey
    ) {
        Set<String> recordDays = new HashSet<>();
        for (Activity activity : activities) {
            recordDays.add(getActivityAttributionDateKey(activity, categories));
        }

        List<ActivityAnalyticsResponse.StatsDayMarker> markers = new ArrayList<>();
        LocalDate startDate = parseDateKey(startKey);
        LocalDate endDate = parseDateKey(endKey);

        for (LocalDate cursor = startDate; !cursor.isAfter(endDate); cursor = cursor.plusDays(1)) {
            String dateKey = formatDateKey(cursor);
            ActivityAnalyticsResponse.StatsDayMarker marker = new ActivityAnalyticsResponse.StatsDayMarker();
            marker.setDateKey(dateKey);
            marker.setWeekday(weekdayLabel(cursor));
            marker.setSubLabel((cursor.getMonthValue()) + "/" + cursor.getDayOfMonth());
            marker.setHasRecord(recordDays.contains(dateKey));
            markers.add(marker);
        }

        return markers;
    }

    public static int getStreakDays(
        List<Activity> activities,
        List<UserActivityCategory> categories,
        LocalDateTime now
    ) {
        Set<String> daySet = new HashSet<>();
        for (Activity activity : activities) {
            daySet.add(getActivityAttributionDateKey(activity, categories));
        }

        int streak = 0;
        LocalDate cursor = now.toLocalDate();
        while (daySet.contains(formatDateKey(cursor))) {
            streak += 1;
            cursor = cursor.minusDays(1);
        }
        return streak;
    }

    public static String buildStatsInsight(
        ActivityAnalyticsResponse.StatsBounds bounds,
        ActivityAnalyticsResponse.StatsMetrics metrics,
        ActivityAnalyticsResponse.StatsMetrics previousMetrics,
        List<ActivityAnalyticsResponse.StatsCategoryBreakdown> categoryBreakdown,
        List<ActivityAnalyticsResponse.StatsChartBucket> chartBuckets,
        List<UserActivityCategory> categories
    ) {
        if (metrics.getTotalMinutes() == 0) {
            return bounds.getLabel() + "还没有可统计的数据，开始记录后会在这里看到趋势与对比。";
        }

        ActivityAnalyticsResponse.StatsCategoryBreakdown topCategory = categoryBreakdown.stream()
            .filter(item -> item.getMinutes() > 0)
            .findFirst()
            .orElse(null);
        String topLabel = topCategory != null
            ? getCategoryMeta(categories, topCategory.getCategory()).getLabel()
            : "";

        Integer minutesChange = calcStatsChangePercent(
            metrics.getTotalMinutes(),
            previousMetrics.getTotalMinutes()
        );
        ActivityAnalyticsResponse.StatsChartBucket busiestBucket = chartBuckets.stream()
            .max(Comparator.comparingInt(ActivityAnalyticsResponse.StatsChartBucket::getMinutes))
            .orElse(null);

        List<String> parts = new ArrayList<>();
        if (topCategory != null) {
            int percent = Math.round((topCategory.getMinutes() / (float) metrics.getTotalMinutes()) * 100);
            parts.add(bounds.getLabel() + "你在「" + topLabel + "」上投入最多，占 " + percent + "%。");
        }

        if (minutesChange != null) {
            if (minutesChange > 0) {
                parts.add("总时长比" + bounds.getPreviousLabel() + "多 " + minutesChange + "%。");
            } else if (minutesChange < 0) {
                parts.add("总时长比" + bounds.getPreviousLabel() + "少 " + Math.abs(minutesChange) + "%。");
            } else {
                parts.add("总时长与" + bounds.getPreviousLabel() + "持平。");
            }
        }

        if (busiestBucket != null && busiestBucket.getMinutes() > 0) {
            parts.add(
                busiestBucket.getLabel()
                    + "（"
                    + busiestBucket.getSubLabel()
                    + "）最充实，记录了 "
                    + formatDuration(busiestBucket.getMinutes())
                    + "。"
            );
        }

        return String.join("", parts);
    }

    public static String formatStatsRangeLabel(String startKey, String endKey) {
        LocalDate start = parseDateKey(startKey);
        LocalDate end = parseDateKey(endKey);
        String startText = start.getMonthValue() + "/" + start.getDayOfMonth();
        String endText = end.getMonthValue() + "/" + end.getDayOfMonth();
        if (startKey.equals(endKey)) {
            return startText;
        }
        return startText + " – " + endText;
    }

    public static String resolveMoodLabel(Double avgMood) {
        if (avgMood == null) {
            return null;
        }
        int index = Math.min(MOOD_LABELS.length, Math.max(1, (int) Math.round(avgMood))) - 1;
        return MOOD_LABELS[index];
    }

    private static ActivityAnalyticsResponse.StatsBounds buildTodayBounds(String endKey, LocalDate today) {
        String previousKey = formatDateKey(today.minusDays(1));
        ActivityAnalyticsResponse.StatsBounds bounds = new ActivityAnalyticsResponse.StatsBounds();
        bounds.setPreset("today");
        bounds.setLabel("今天");
        bounds.setPreviousLabel("昨天");
        bounds.setStartKey(endKey);
        bounds.setEndKey(endKey);
        bounds.setPreviousStartKey(previousKey);
        bounds.setPreviousEndKey(previousKey);
        bounds.setDayCount(1);
        return bounds;
    }

    private static ActivityAnalyticsResponse.StatsBounds buildYesterdayBounds(LocalDate today) {
        LocalDate yesterday = today.minusDays(1);
        String yesterdayKey = formatDateKey(yesterday);
        String previousKey = formatDateKey(today.minusDays(2));
        ActivityAnalyticsResponse.StatsBounds bounds = new ActivityAnalyticsResponse.StatsBounds();
        bounds.setPreset("yesterday");
        bounds.setLabel("昨日");
        bounds.setPreviousLabel("前日");
        bounds.setStartKey(yesterdayKey);
        bounds.setEndKey(yesterdayKey);
        bounds.setPreviousStartKey(previousKey);
        bounds.setPreviousEndKey(previousKey);
        bounds.setDayCount(1);
        return bounds;
    }

    private static ActivityAnalyticsResponse.StatsBounds buildWeekBounds(LocalDate today, String endKey) {
        LocalDate weekStart = getWeekStartMonday(today);
        String startKey = formatDateKey(weekStart);
        int dayCount = countDaysInclusive(startKey, endKey);
        LocalDate previousWeekStart = weekStart.minusDays(7);
        LocalDate previousWeekEnd = previousWeekStart.plusDays(dayCount - 1L);

        ActivityAnalyticsResponse.StatsBounds bounds = new ActivityAnalyticsResponse.StatsBounds();
        bounds.setPreset("week");
        bounds.setLabel("本周");
        bounds.setPreviousLabel("上周");
        bounds.setStartKey(startKey);
        bounds.setEndKey(endKey);
        bounds.setPreviousStartKey(formatDateKey(previousWeekStart));
        bounds.setPreviousEndKey(formatDateKey(previousWeekEnd));
        bounds.setDayCount(dayCount);
        return bounds;
    }

    private static ActivityAnalyticsResponse.StatsBounds buildRollingBounds(
        String preset,
        String label,
        String previousLabel,
        LocalDate today,
        String endKey,
        int dayCount
    ) {
        LocalDate startDate = today.minusDays(dayCount - 1L);
        LocalDate previousEndDate = startDate.minusDays(1);
        LocalDate previousStartDate = previousEndDate.minusDays(dayCount - 1L);

        ActivityAnalyticsResponse.StatsBounds bounds = new ActivityAnalyticsResponse.StatsBounds();
        bounds.setPreset(preset);
        bounds.setLabel(label);
        bounds.setPreviousLabel(previousLabel);
        bounds.setStartKey(formatDateKey(startDate));
        bounds.setEndKey(endKey);
        bounds.setPreviousStartKey(formatDateKey(previousStartDate));
        bounds.setPreviousEndKey(formatDateKey(previousEndDate));
        bounds.setDayCount(dayCount);
        return bounds;
    }

    private static ActivityAnalyticsResponse.StatsBounds buildMonthBounds(LocalDate today, String endKey) {
        LocalDate startDate = today.withDayOfMonth(1);
        String startKey = formatDateKey(startDate);
        int dayCount = countDaysInclusive(startKey, endKey);
        LocalDate previousEndDate = startDate.minusDays(1);
        LocalDate previousStartDate = previousEndDate.minusDays(dayCount - 1L);

        ActivityAnalyticsResponse.StatsBounds bounds = new ActivityAnalyticsResponse.StatsBounds();
        bounds.setPreset("month");
        bounds.setLabel("本月");
        bounds.setPreviousLabel("上月同期");
        bounds.setStartKey(startKey);
        bounds.setEndKey(endKey);
        bounds.setPreviousStartKey(formatDateKey(previousStartDate));
        bounds.setPreviousEndKey(formatDateKey(previousEndDate));
        bounds.setDayCount(dayCount);
        return bounds;
    }

    private static ActivityAnalyticsResponse.StatsBounds buildCustomBounds(String startKey, String endKey) {
        int dayCount = countDaysInclusive(startKey, endKey);
        LocalDate previousEndDate = parseDateKey(startKey).minusDays(1);
        LocalDate previousStartDate = previousEndDate.minusDays(dayCount - 1L);

        ActivityAnalyticsResponse.StatsBounds bounds = new ActivityAnalyticsResponse.StatsBounds();
        bounds.setPreset("custom");
        bounds.setLabel(formatStatsRangeLabel(startKey, endKey));
        bounds.setPreviousLabel("前 " + dayCount + " 天");
        bounds.setStartKey(startKey);
        bounds.setEndKey(endKey);
        bounds.setPreviousStartKey(formatDateKey(previousStartDate));
        bounds.setPreviousEndKey(formatDateKey(previousEndDate));
        bounds.setDayCount(dayCount);
        return bounds;
    }

    private static String clampDateKeyToToday(String dateKey, String todayKey) {
        return dateKey.compareTo(todayKey) > 0 ? todayKey : dateKey;
    }

    private static LocalDate getWeekStartMonday(LocalDate date) {
        int weekday = date.getDayOfWeek().getValue();
        int offset = weekday == 7 ? -6 : 1 - weekday;
        return date.plusDays(offset);
    }

    private static boolean isActivityInDateRange(
        Activity activity,
        List<UserActivityCategory> categories,
        String startKey,
        String endKey
    ) {
        String day = getActivityAttributionDateKey(activity, categories);
        return day.compareTo(startKey) >= 0 && day.compareTo(endKey) <= 0;
    }

    private static int sumMinutesInRange(
        List<Activity> activities,
        List<UserActivityCategory> categories,
        String startKey,
        String endKey
    ) {
        return activities.stream()
            .filter(item -> isActivityInDateRange(item, categories, startKey, endKey))
            .mapToInt(item -> item.getDurationMinutes() != null ? item.getDurationMinutes() : item.calculateDuration())
            .sum();
    }

    private static List<ActivityAnalyticsResponse.CategoryMinutes> aggregateCategoryMinutes(
        List<Activity> activities,
        List<UserActivityCategory> categories,
        String startKey,
        String endKey
    ) {
        Map<String, Integer> totals = new HashMap<>();
        for (Activity activity : activities) {
            String day = getActivityAttributionDateKey(activity, categories);
            if (day.compareTo(startKey) >= 0 && day.compareTo(endKey) <= 0) {
                int duration = activity.getDurationMinutes() != null
                    ? activity.getDurationMinutes()
                    : activity.calculateDuration();
                totals.merge(activity.getCategory(), duration, Integer::sum);
            }
        }

        return totals.entrySet().stream()
            .map(entry -> {
                ActivityAnalyticsResponse.CategoryMinutes item = new ActivityAnalyticsResponse.CategoryMinutes();
                item.setCategory(entry.getKey());
                item.setMinutes(entry.getValue());
                return item;
            })
            .sorted(Comparator.comparingInt(ActivityAnalyticsResponse.CategoryMinutes::getMinutes).reversed())
            .toList();
    }

    private static List<ActivityAnalyticsResponse.StatsChartBucket> buildDailyBuckets(
        List<Activity> activities,
        List<UserActivityCategory> categories,
        String startKey,
        String endKey
    ) {
        List<ActivityAnalyticsResponse.StatsChartBucket> buckets = new ArrayList<>();
        LocalDate startDate = parseDateKey(startKey);
        LocalDate endDate = parseDateKey(endKey);

        for (LocalDate cursor = startDate; !cursor.isAfter(endDate); cursor = cursor.plusDays(1)) {
            String key = formatDateKey(cursor);
            ActivityAnalyticsResponse.StatsChartBucket bucket = new ActivityAnalyticsResponse.StatsChartBucket();
            bucket.setId(key);
            bucket.setLabel(weekdayLabel(cursor));
            bucket.setSubLabel(cursor.getMonthValue() + "/" + cursor.getDayOfMonth());
            bucket.setMinutes(sumMinutesInRange(activities, categories, key, key));
            bucket.setCategories(aggregateCategoryMinutes(activities, categories, key, key));
            buckets.add(bucket);
        }

        return buckets;
    }

    private static List<ActivityAnalyticsResponse.StatsChartBucket> buildGroupedBuckets(
        List<Activity> activities,
        List<UserActivityCategory> categories,
        String startKey,
        String endKey,
        int groupSize
    ) {
        List<ActivityAnalyticsResponse.StatsChartBucket> buckets = new ArrayList<>();
        LocalDate startDate = parseDateKey(startKey);
        LocalDate endDate = parseDateKey(endKey);
        LocalDate cursor = startDate;
        int index = 1;

        while (!cursor.isAfter(endDate)) {
            LocalDate groupStart = cursor;
            LocalDate groupEnd = cursor.plusDays(groupSize - 1L);
            if (groupEnd.isAfter(endDate)) {
                groupEnd = endDate;
            }
            String start = formatDateKey(groupStart);
            String end = formatDateKey(groupEnd);

            ActivityAnalyticsResponse.StatsChartBucket bucket = new ActivityAnalyticsResponse.StatsChartBucket();
            bucket.setId(start + "-" + end);
            bucket.setLabel("段" + index);
            bucket.setSubLabel(groupStart.getMonthValue() + "/" + groupStart.getDayOfMonth());
            bucket.setMinutes(sumMinutesInRange(activities, categories, start, end));
            bucket.setCategories(aggregateCategoryMinutes(activities, categories, start, end));
            buckets.add(bucket);

            cursor = groupEnd.plusDays(1);
            index += 1;
        }

        return buckets;
    }

    private static Double calculateAvgMood(List<Integer> moodValues) {
        if (moodValues.isEmpty()) {
            return null;
        }
        double average = moodValues.stream().mapToInt(Integer::intValue).average().orElse(0);
        return Math.round(average * 10.0) / 10.0;
    }

    private static String weekdayLabel(LocalDate date) {
        return WEEKDAYS[date.getDayOfWeek().getValue() % 7];
    }

    private static String formatDuration(int minutes) {
        int hours = minutes / 60;
        int mins = minutes % 60;
        if (hours == 0) {
            return mins + " 分钟";
        }
        if (mins == 0) {
            return hours + " 小时";
        }
        return hours + "h " + mins + "m";
    }
}
