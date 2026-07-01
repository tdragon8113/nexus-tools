import { addDays, formatApiDateTime, formatDateKey } from './record';
import type { StatsCategoryBreakdown, StatsPeriodBounds, StatsPeriodMetrics } from './stats';
import type { Activity, ActivityCategory, ActivityCategoryConfig } from './types';

export const demoStatsCategories: ActivityCategoryConfig[] = [
    { id: 'study', label: '学习', emoji: '📚', xpPerHour: 20, sortOrder: 1 },
    { id: 'work', label: '工作', emoji: '💼', xpPerHour: 18, sortOrder: 2 },
    { id: 'exercise', label: '运动', emoji: '🏃', xpPerHour: 16, sortOrder: 3 },
    { id: 'rest', label: '休息', emoji: '☕', xpPerHour: 8, sortOrder: 4 },
];

function getWeekBounds(now = new Date()): StatsPeriodBounds {
    const weekday = now.getDay();
    const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
    const monday = addDays(now, mondayOffset);
    const sunday = addDays(monday, 6);
    const previousMonday = addDays(monday, -7);
    const previousSunday = addDays(sunday, -7);

    return {
        preset: 'week',
        label: '本周',
        previousLabel: '上周',
        startKey: formatDateKey(monday),
        endKey: formatDateKey(sunday),
        previousStartKey: formatDateKey(previousMonday),
        previousEndKey: formatDateKey(previousSunday),
        dayCount: 7,
    };
}

function atLocal(dateKey: string, hour: number, minute: number): Date {
    return new Date(
        Number(dateKey.slice(0, 4)),
        Number(dateKey.slice(5, 7)) - 1,
        Number(dateKey.slice(8, 10)),
        hour,
        minute,
        0,
        0,
    );
}

function demoActivity(
    id: string,
    dateKey: string,
    startHour: number,
    startMinute: number,
    durationMin: number,
    category: ActivityCategory,
    title: string,
): Activity {
    const startAt = atLocal(dateKey, startHour, startMinute);
    const endAt = new Date(startAt.getTime() + durationMin * 60_000);
    const startedAt = formatApiDateTime(startAt);

    return {
        id,
        category,
        title,
        durationMin,
        mood: 4,
        xp: Math.max(1, Math.round((durationMin / 60) * 20)),
        startedAt,
        endedAt: formatApiDateTime(endAt),
        createdAt: startedAt,
    };
}

function buildDemoActivities(bounds: StatsPeriodBounds): Activity[] {
    const startMonday = new Date(
        Number(bounds.startKey.slice(0, 4)),
        Number(bounds.startKey.slice(5, 7)) - 1,
        Number(bounds.startKey.slice(8, 10)),
    );
    const day = (offset: number) => formatDateKey(addDays(startMonday, offset));
    const prevDay = (offset: number) => formatDateKey(addDays(startMonday, offset - 7));

    return [
        demoActivity('demo-1', day(0), 9, 30, 90, 'study', '阅读'),
        demoActivity('demo-2', day(0), 14, 0, 120, 'work', '项目开发'),
        demoActivity('demo-3', day(1), 10, 0, 75, 'study', '课程'),
        demoActivity('demo-4', day(1), 18, 30, 45, 'exercise', '跑步'),
        demoActivity('demo-5', day(2), 9, 0, 150, 'work', '需求评审'),
        demoActivity('demo-6', day(2), 21, 0, 30, 'rest', '放松'),
        demoActivity('demo-7', day(3), 14, 30, 60, 'study', '整理笔记'),
        demoActivity('demo-8', day(4), 11, 0, 105, 'work', '联调'),
        demoActivity('demo-9', prevDay(0), 10, 0, 60, 'study', '示例学习'),
        demoActivity('demo-10', prevDay(1), 15, 0, 90, 'work', '示例工作'),
        demoActivity('demo-11', prevDay(2), 19, 0, 40, 'rest', '示例休息'),
    ];
}

function sumMinutes(activities: Activity[]): number {
    return activities.reduce((total, item) => total + item.durationMin, 0);
}

function buildCategoryBreakdown(
    activities: Activity[],
    bounds: StatsPeriodBounds,
): StatsCategoryBreakdown[] {
    const current = new Map<ActivityCategory, number>();
    const previous = new Map<ActivityCategory, number>();

    activities.forEach((activity) => {
        const dateKey = activity.startedAt?.slice(0, 10) ?? activity.createdAt.slice(0, 10);
        const bucket =
            dateKey >= bounds.startKey && dateKey <= bounds.endKey
                ? current
                : dateKey >= bounds.previousStartKey && dateKey <= bounds.previousEndKey
                  ? previous
                  : null;
        if (!bucket) {
            return;
        }
        bucket.set(activity.category, (bucket.get(activity.category) ?? 0) + activity.durationMin);
    });

    return demoStatsCategories
        .map((category) => {
            const minutes = current.get(category.id) ?? 0;
            if (minutes <= 0) {
                return null;
            }
            const previousMinutes = previous.get(category.id) ?? 0;
            const changePercent =
                previousMinutes > 0
                    ? Math.round(((minutes - previousMinutes) / previousMinutes) * 100)
                    : null;
            return {
                category: category.id,
                minutes,
                previousMinutes,
                changePercent,
            };
        })
        .filter((item): item is StatsCategoryBreakdown => item !== null);
}

function buildMetrics(activities: Activity[], bounds: StatsPeriodBounds): StatsPeriodMetrics {
    const currentActivities = activities.filter((activity) => {
        const dateKey = activity.startedAt?.slice(0, 10) ?? activity.createdAt.slice(0, 10);
        return dateKey >= bounds.startKey && dateKey <= bounds.endKey;
    });
    const totalMinutes = sumMinutes(currentActivities);
    const recordDays = new Set(
        currentActivities.map(
            (activity) => activity.startedAt?.slice(0, 10) ?? activity.createdAt.slice(0, 10),
        ),
    ).size;

    return {
        totalMinutes,
        totalXp: currentActivities.reduce((total, item) => total + item.xp, 0),
        recordDays,
        activityCount: currentActivities.length,
        avgMood: 4.2,
        avgDailyMinutes: Math.round(totalMinutes / bounds.dayCount),
    };
}

export function getDemoStatsViewData() {
    const bounds = getWeekBounds();
    const activities = buildDemoActivities(bounds);
    const categoryBreakdown = buildCategoryBreakdown(activities, bounds);
    const metrics = buildMetrics(activities, bounds);
    const previousTotal = sumMinutes(
        activities.filter((activity) => {
            const dateKey = activity.startedAt?.slice(0, 10) ?? activity.createdAt.slice(0, 10);
            return dateKey >= bounds.previousStartKey && dateKey <= bounds.previousEndKey;
        }),
    );
    const totalChange =
        previousTotal > 0
            ? Math.round(((metrics.totalMinutes - previousTotal) / previousTotal) * 100)
            : null;

    return {
        activities,
        categories: demoStatsCategories,
        bounds,
        metrics,
        categoryBreakdown,
        totalChange,
    };
}
