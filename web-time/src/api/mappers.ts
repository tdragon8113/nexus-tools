import type { AnalyticsData, StatsRangePreset } from '../domain/stats';
import type {
    Activity,
    ActivityCategoryConfig,
    ActivitySummary,
    AuthSession,
    AuthUser,
    Reflection,
    ReflectionScope,
} from '../domain/types';
import type {
    ActivityAnalyticsResponse,
    ActivityCategoryResponse,
    ActivityResponse,
    ActivitySummaryResponse,
    ReflectionResponse,
    UserResponse,
} from './types';

const statsRangePresets = new Set<StatsRangePreset>([
    'today',
    'yesterday',
    'week',
    'month',
    '7d',
    '30d',
    'custom',
]);

function toStatsRangePreset(value: string): StatsRangePreset {
    if (statsRangePresets.has(value as StatsRangePreset)) {
        return value as StatsRangePreset;
    }
    return 'week';
}

const accountAvatarColors = [
    '#0f3e17',
    '#2f6feb',
    '#7c3aed',
    '#d97706',
    '#db2777',
    '#0891b2',
] as const;

function pickAvatarColor(account: string): string {
    let hash = 0;
    for (let index = 0; index < account.length; index += 1) {
        hash = (hash + account.charCodeAt(index) * (index + 1)) % accountAvatarColors.length;
    }
    return accountAvatarColors[hash];
}

function toMood(value: number | null | undefined): 1 | 2 | 3 | 4 | 5 {
    const mood = value ?? 3;
    if (mood < 1) return 1;
    if (mood > 5) return 5;
    return mood as 1 | 2 | 3 | 4 | 5;
}

export function mapAuthUser(user: UserResponse): AuthUser {
    return {
        id: String(user.id),
        displayName: user.nickname?.trim() || user.username,
        account: user.username,
        avatarColor: pickAvatarColor(user.username),
    };
}

export function mapAuthSession(user: UserResponse): AuthSession {
    return { user: mapAuthUser(user) };
}

export function mapActivity(response: ActivityResponse): Activity {
    return {
        id: String(response.id),
        category: response.category,
        title: response.title,
        durationMin: response.durationMinutes ?? 0,
        mood: toMood(response.mood),
        note: response.notes ?? undefined,
        xp: response.xp ?? 0,
        startedAt: response.startTime,
        endedAt: response.endTime ?? undefined,
        createdAt: response.createdAt,
    };
}

export function mapActivities(responses: ActivityResponse[]): Activity[] {
    return responses.map(mapActivity);
}

export function mapCategory(response: ActivityCategoryResponse): ActivityCategoryConfig {
    return {
        id: response.id,
        label: response.label,
        emoji: response.emoji,
        xpPerHour: response.xpPerHour,
        sortOrder: response.sortOrder,
    };
}

export function mapCategories(responses: ActivityCategoryResponse[]): ActivityCategoryConfig[] {
    return responses.map(mapCategory);
}

export function mapReflection(response: ReflectionResponse): Reflection {
    return {
        id: String(response.id),
        scope: response.scope as ReflectionScope,
        date: response.periodKey,
        content: response.content,
    };
}

export function mapReflections(responses: ReflectionResponse[]): Reflection[] {
    return responses.map(mapReflection);
}

export function mapSummary(response: ActivitySummaryResponse): ActivitySummary {
    return {
        totalXp: response.totalXp,
        level: response.level,
        levelProgress: response.levelProgress,
        recordDays: response.recordDays,
        streak: response.streak,
    };
}

export function mapAnalytics(response: ActivityAnalyticsResponse): AnalyticsData {
    return {
        bounds: {
            preset: toStatsRangePreset(response.bounds.preset),
            label: response.bounds.label,
            previousLabel: response.bounds.previousLabel,
            startKey: response.bounds.startKey,
            endKey: response.bounds.endKey,
            previousStartKey: response.bounds.previousStartKey,
            previousEndKey: response.bounds.previousEndKey,
            dayCount: response.bounds.dayCount,
        },
        metrics: {
            totalMinutes: response.metrics.totalMinutes,
            totalXp: response.metrics.totalXp,
            recordDays: response.metrics.recordDays,
            activityCount: response.metrics.activityCount,
            avgMood: response.metrics.avgMood,
            avgDailyMinutes: response.metrics.avgDailyMinutes,
        },
        previousMetrics: {
            totalMinutes: response.previousMetrics.totalMinutes,
            totalXp: response.previousMetrics.totalXp,
            recordDays: response.previousMetrics.recordDays,
            activityCount: response.previousMetrics.activityCount,
            avgMood: response.previousMetrics.avgMood,
            avgDailyMinutes: response.previousMetrics.avgDailyMinutes,
        },
        totalChange: response.totalChange,
        avgChange: response.avgChange,
        xpChange: response.xpChange,
        categoryBreakdown: response.categoryBreakdown.map((item) => ({
            category: item.category,
            minutes: item.minutes,
            previousMinutes: item.previousMinutes,
            changePercent: item.changePercent,
        })),
        chartBuckets: response.chartBuckets.map((item) => ({
            id: item.id,
            label: item.label,
            subLabel: item.subLabel,
            minutes: item.minutes,
            categories: item.categories.map((segment) => ({
                category: segment.category,
                minutes: segment.minutes,
            })),
        })),
        dayMarkers: response.dayMarkers.map((item) => ({
            dateKey: item.dateKey,
            weekday: item.weekday,
            subLabel: item.subLabel,
            hasRecord: item.hasRecord,
        })),
        streak: response.streak,
        insight: response.insight,
        moodLabel: response.moodLabel || null,
        rangeLabel: response.rangeLabel,
    };
}

export function getAccountAvatarLetter(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) {
        return '记';
    }
    return trimmed.slice(0, 1);
}
