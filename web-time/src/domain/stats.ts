import { getActivityAttributionDateKey } from './dates';
import {
    addDays,
    formatDateKey,
    formatDuration,
    formatTimeLabel,
    getActivityDurationMin,
    getActivityEndAt,
    getActivityStartAt,
    getActivityTimeRangeMs,
    getCategoryMeta,
    getCategoryTimelineColor,
    isActivityOngoing,
    parseApiDateTime,
} from './record';
import type { Activity, ActivityCategory, ActivityCategoryConfig } from './types';

export type StatsRangePreset =
    | 'today'
    | 'yesterday'
    | 'week'
    | 'month'
    | '7d'
    | '30d'
    | 'custom';

export type StatsRangeSelection = {
    preset: StatsRangePreset;
    customStartKey?: string;
    customEndKey?: string;
};

export type StatsPeriodBounds = {
    preset: StatsRangePreset;
    label: string;
    previousLabel: string;
    startKey: string;
    endKey: string;
    previousStartKey: string;
    previousEndKey: string;
    dayCount: number;
};

export type StatsPeriodMetrics = {
    totalMinutes: number;
    totalXp: number;
    recordDays: number;
    activityCount: number;
    avgMood: number | null;
    avgDailyMinutes: number;
};

export type StatsCategoryBreakdown = {
    category: ActivityCategory;
    minutes: number;
    previousMinutes: number;
    changePercent: number | null;
};

export type StatsChartBucket = {
    id: string;
    label: string;
    subLabel: string;
    minutes: number;
    categories: Array<{ category: ActivityCategory; minutes: number }>;
};

export type StatsDayMarker = {
    dateKey: string;
    weekday: string;
    subLabel: string;
    hasRecord: boolean;
};

export type AnalyticsData = {
    bounds: StatsPeriodBounds;
    metrics: StatsPeriodMetrics;
    previousMetrics: StatsPeriodMetrics;
    totalChange: number | null;
    avgChange: number | null;
    xpChange: number | null;
    categoryBreakdown: StatsCategoryBreakdown[];
    chartBuckets: StatsChartBucket[];
    dayMarkers: StatsDayMarker[];
    streak: number;
    insight: string;
    moodLabel: string | null;
    rangeLabel: string;
};

function clampDateKeyToToday(dateKey: string, todayKey: string): string {
    return dateKey > todayKey ? todayKey : dateKey;
}

export function normalizeStatsRangeSelection(
    selection: StatsRangeSelection,
    now = new Date(),
): StatsRangeSelection {
    if (selection.preset !== 'custom') {
        return selection;
    }

    const todayKey = formatDateKey(now);
    let endKey = clampDateKeyToToday(selection.customEndKey ?? todayKey, todayKey);
    let startKey = selection.customStartKey ?? endKey;

    if (startKey > endKey) {
        [startKey, endKey] = [endKey, startKey];
    }

    return {
        preset: 'custom',
        customStartKey: startKey,
        customEndKey: endKey,
    };
}

export function formatStatsRangeLabel(startKey: string, endKey: string): string {
    const start = new Date(`${startKey}T12:00:00`);
    const end = new Date(`${endKey}T12:00:00`);
    const startText = `${start.getMonth() + 1}/${start.getDate()}`;
    const endText = `${end.getMonth() + 1}/${end.getDate()}`;

    if (startKey === endKey) {
        return startText;
    }

    return `${startText} – ${endText}`;
}

export function filterActivitiesForStats(
    activities: Activity[],
    excludeSleep: boolean,
): Activity[] {
    if (!excludeSleep) {
        return activities;
    }
    return activities.filter((item) => item.category !== 'sleep');
}

export function parseBucketDateRange(bucketId: string): { startKey: string; endKey: string } {
    if (/^\d{4}-\d{2}-\d{2}$/.test(bucketId)) {
        return { startKey: bucketId, endKey: bucketId };
    }

    const match = bucketId.match(/^(\d{4}-\d{2}-\d{2})-(\d{4}-\d{2}-\d{2})$/);
    if (match) {
        return { startKey: match[1], endKey: match[2] };
    }

    return { startKey: bucketId, endKey: bucketId };
}

export function getActivitiesInDateRange(
    activities: Activity[],
    categories: ActivityCategoryConfig[],
    startKey: string,
    endKey: string,
    excludeSleep = false,
): Activity[] {
    const source = filterActivitiesForStats(activities, excludeSleep);

    return source
        .filter((item) => {
            const day = getActivityAttributionDateKey(item, categories);
            return day >= startKey && day <= endKey;
        })
        .sort(
            (left, right) =>
                parseApiDateTime(getActivityStartAt(left)).getTime() -
                parseApiDateTime(getActivityStartAt(right)).getTime(),
        );
}

export function calcStatsChangePercent(current: number, previous: number): number | null {
    if (previous === 0) {
        return current > 0 ? 100 : null;
    }
    return Math.round(((current - previous) / previous) * 100);
}

export function computeLivePeriodTotalMinutes(
    activities: Activity[],
    categories: ActivityCategoryConfig[],
    startKey: string,
    endKey: string,
    excludeSleep: boolean,
    referenceMs = Date.now(),
): number {
    return getActivitiesInDateRange(activities, categories, startKey, endKey, excludeSleep).reduce(
        (sum, item) => sum + getActivityDurationMin(item, referenceMs),
        0,
    );
}

export function adjustCategoryBreakdownForLiveActivities(
    apiBreakdown: StatsCategoryBreakdown[],
    activities: Activity[],
    categories: ActivityCategoryConfig[],
    startKey: string,
    endKey: string,
    excludeSleep: boolean,
    referenceMs = Date.now(),
): StatsCategoryBreakdown[] {
    const periodActivities = getActivitiesInDateRange(
        activities,
        categories,
        startKey,
        endKey,
        excludeSleep,
    );
    const currentByCategory = new Map<ActivityCategory, number>();
    periodActivities.forEach((activity) => {
        const durationMin = getActivityDurationMin(activity, referenceMs);
        currentByCategory.set(
            activity.category,
            (currentByCategory.get(activity.category) ?? 0) + durationMin,
        );
    });

    const previousByCategory = new Map(
        apiBreakdown.map((item) => [item.category, item.previousMinutes]),
    );
    const categoryIds = new Set<ActivityCategory>([
        ...currentByCategory.keys(),
        ...apiBreakdown.map((item) => item.category),
    ]);

    return [...categoryIds]
        .map((category) => {
            const minutes = currentByCategory.get(category) ?? 0;
            const previousMinutes = previousByCategory.get(category) ?? 0;
            if (minutes <= 0 && previousMinutes <= 0) {
                return null;
            }
            return {
                category,
                minutes,
                previousMinutes,
                changePercent: calcStatsChangePercent(minutes, previousMinutes),
            };
        })
        .filter((item): item is StatsCategoryBreakdown => item !== null)
        .sort((left, right) => right.minutes - left.minutes);
}

export function getPeriodDayMarkers(
    activities: Activity[],
    categories: ActivityCategoryConfig[],
    startKey: string,
    endKey: string,
): StatsDayMarker[] {
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const recordDays = new Set(
        activities.map((item) => getActivityAttributionDateKey(item, categories)),
    );
    const markers: StatsDayMarker[] = [];
    const startDate = new Date(`${startKey}T12:00:00`);
    const endDate = new Date(`${endKey}T12:00:00`);

    for (let cursor = new Date(startDate); cursor <= endDate; cursor = addDays(cursor, 1)) {
        const dateKey = formatDateKey(cursor);
        markers.push({
            dateKey,
            weekday: weekdays[cursor.getDay()],
            subLabel: `${cursor.getMonth() + 1}/${cursor.getDate()}`,
            hasRecord: recordDays.has(dateKey),
        });
    }

    return markers;
}

export type TimeOfDaySegmentId = 'lateNight' | 'morning' | 'afternoon' | 'evening';

export const TIME_OF_DAY_SEGMENTS: Array<{
    id: TimeOfDaySegmentId;
    label: string;
    hint: string;
}> = [
    { id: 'lateNight', label: '深夜', hint: '0:00–6:00' },
    { id: 'morning', label: '上午', hint: '6:00–12:00' },
    { id: 'afternoon', label: '下午', hint: '12:00–18:00' },
    { id: 'evening', label: '晚上', hint: '18:00–24:00' },
];

function getTimeOfDaySegmentFromHour(hour: number): TimeOfDaySegmentId {
    if (hour >= 0 && hour < 6) {
        return 'lateNight';
    }
    if (hour >= 6 && hour < 12) {
        return 'morning';
    }
    if (hour >= 12 && hour < 18) {
        return 'afternoon';
    }
    return 'evening';
}

function getActivityTimeOfDaySegment(activity: Activity): TimeOfDaySegmentId {
    const start = parseApiDateTime(getActivityStartAt(activity));
    return getTimeOfDaySegmentFromHour(start.getHours());
}

export type StatsTimeOfDayBreakdown = {
    segment: TimeOfDaySegmentId;
    label: string;
    hint: string;
    minutes: number;
    categories: Array<{ category: ActivityCategory; minutes: number }>;
};

export function getPeriodTimeOfDayBreakdown(
    activities: Activity[],
    categories: ActivityCategoryConfig[],
    startKey: string,
    endKey: string,
    referenceMs = Date.now(),
): StatsTimeOfDayBreakdown[] {
    const periodActivities = getActivitiesInDateRange(
        activities,
        categories,
        startKey,
        endKey,
    );
    const segmentTotals = new Map<TimeOfDaySegmentId, number>();
    const segmentCategories = new Map<TimeOfDaySegmentId, Map<ActivityCategory, number>>();

    periodActivities.forEach((activity) => {
        const segment = getActivityTimeOfDaySegment(activity);
        const durationMin = getActivityDurationMin(activity, referenceMs);
        segmentTotals.set(segment, (segmentTotals.get(segment) ?? 0) + durationMin);
        const categoryTotals = segmentCategories.get(segment) ?? new Map<ActivityCategory, number>();
        categoryTotals.set(
            activity.category,
            (categoryTotals.get(activity.category) ?? 0) + durationMin,
        );
        segmentCategories.set(segment, categoryTotals);
    });

    return TIME_OF_DAY_SEGMENTS.map(({ id, label, hint }) => ({
        segment: id,
        label,
        hint,
        minutes: segmentTotals.get(id) ?? 0,
        categories: [...(segmentCategories.get(id)?.entries() ?? [])]
            .map(([category, minutes]) => ({ category, minutes }))
            .sort((left, right) => right.minutes - left.minutes),
    }));
}

export type ActivityDayTrackSegment = {
    id: string;
    category: ActivityCategory;
    left: number;
    width: number;
    color: string;
    title: string;
    isLive?: boolean;
};

export function buildActivityDayTrack(
    activities: Activity[],
    categories: ActivityCategoryConfig[],
    referenceMs = Date.now(),
): {
    segments: ActivityDayTrackSegment[];
    axisStart: string;
    axisMid: string;
    axisEnd: string;
} | null {
    if (activities.length === 0) {
        return null;
    }

    const timelineItems = activities.map((activity) => {
        const { startMs, endMs } = getActivityTimeRangeMs(activity, referenceMs);
        const meta = getCategoryMeta(categories, activity.category);
        const isLive = isActivityOngoing(activity);
        const endLabel = isLive
            ? '进行中'
            : formatTimeLabel(getActivityEndAt(activity, referenceMs));
        return {
            id: activity.id,
            category: activity.category,
            startMs,
            endMs,
            isLive,
            title: `${meta.label} ${formatTimeLabel(getActivityStartAt(activity))}–${endLabel}`,
        };
    });

    const sorted = [...timelineItems].sort((left, right) => left.startMs - right.startMs);
    const windowStartMs = Math.min(...sorted.map((item) => item.startMs));
    const windowEndMs = Math.max(...sorted.map((item) => item.endMs));
    const spanMs = Math.max(windowEndMs - windowStartMs, 30 * 60 * 1000);
    const axisEndMs = windowStartMs + spanMs;
    const midMs = windowStartMs + spanMs / 2;

    return {
        segments: sorted.map((item) => ({
            id: item.id,
            category: item.category,
            left: ((item.startMs - windowStartMs) / spanMs) * 100,
            width: Math.max(1.5, ((item.endMs - item.startMs) / spanMs) * 100),
            color: getCategoryTimelineColor(item.category),
            title: item.title,
            isLive: item.isLive,
        })),
        axisStart: formatTimeLabel(new Date(windowStartMs)),
        axisMid: formatTimeLabel(new Date(midMs)),
        axisEnd: formatTimeLabel(new Date(axisEndMs)),
    };
}

export type StatsDailyTrack = {
    dateKey: string;
    weekday: string;
    subLabel: string;
    minutes: number;
    hasRecord: boolean;
    segments: ActivityDayTrackSegment[];
    axisStart: string;
    axisMid: string;
    axisEnd: string;
    activities: Activity[];
};

export function getPeriodDailyTracks(
    activities: Activity[],
    categories: ActivityCategoryConfig[],
    startKey: string,
    endKey: string,
    referenceMs = Date.now(),
): StatsDailyTrack[] {
    const dayMarkers = getPeriodDayMarkers(activities, categories, startKey, endKey);

    return dayMarkers
        .map((day) => {
            const dayActivities = getActivitiesInDateRange(
                activities,
                categories,
                day.dateKey,
                day.dateKey,
            );
            const track = buildActivityDayTrack(dayActivities, categories, referenceMs);
            const minutes = dayActivities.reduce(
                (sum, item) => sum + getActivityDurationMin(item, referenceMs),
                0,
            );

            return {
                dateKey: day.dateKey,
                weekday: day.weekday,
                subLabel: day.subLabel,
                minutes,
                hasRecord: day.hasRecord,
                segments: track?.segments ?? [],
                axisStart: track?.axisStart ?? '',
                axisMid: track?.axisMid ?? '',
                axisEnd: track?.axisEnd ?? '',
                activities: dayActivities,
            };
        })
        .reverse();
}

export function getRecordDailyTracks(
    activities: Activity[],
    categories: ActivityCategoryConfig[],
): StatsDailyTrack[] {
    if (activities.length === 0) {
        return [];
    }

    const dateKeys = activities
        .map((item) => getActivityAttributionDateKey(item, categories))
        .sort((a, b) => a.localeCompare(b));
    const startKey = dateKeys[0];
    const endKey = dateKeys[dateKeys.length - 1];

    return getPeriodDailyTracks(activities, categories, startKey, endKey).filter(
        (day) => day.hasRecord,
    );
}

export { formatDuration, getCategoryMeta, getCategoryTimelineColor };
