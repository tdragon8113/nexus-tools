import { addDays, formatDateKey, getActivityStartAt, getCategoryMeta, parseApiDateTime } from './record';
import type { Activity, ActivityCategory, ActivityCategoryConfig } from './types';

export const SLEEP_CATEGORY_ID = 'sleep';
const SLEEP_DAY_ROLLOVER_HOUR = 6;

export function isSleepCategory(
    categoryId: ActivityCategory,
    categories: ActivityCategoryConfig[],
): boolean {
    if (categoryId === SLEEP_CATEGORY_ID) {
        return true;
    }
    return getCategoryMeta(categories, categoryId).label === '睡觉';
}

/** 活动归属日：睡觉按开始时间（6 点前算前一天），其余按开始时间 */
export function getActivityAttributionDateKey(
    activity: Activity,
    categories: ActivityCategoryConfig[],
): string {
    const startAt = parseApiDateTime(getActivityStartAt(activity));

    if (isSleepCategory(activity.category, categories)) {
        if (startAt.getHours() < SLEEP_DAY_ROLLOVER_HOUR) {
            return formatDateKey(addDays(startAt, -1));
        }
        return formatDateKey(startAt);
    }

    return formatDateKey(startAt);
}

export function getTodayActivities(
    activities: Activity[],
    categories: ActivityCategoryConfig[],
    date = new Date(),
): Activity[] {
    const key = formatDateKey(date);
    return activities
        .filter((item) => getActivityAttributionDateKey(item, categories) === key)
        .sort((a, b) => getActivityStartAt(b).localeCompare(getActivityStartAt(a)));
}

export function getTodayDuration(
    activities: Activity[],
    categories: ActivityCategoryConfig[],
    date = new Date(),
): number {
    return getTodayActivities(activities, categories, date).reduce(
        (sum, item) => sum + item.durationMin,
        0,
    );
}

export function getTodayCategoryStats(
    activities: Activity[],
    categories: ActivityCategoryConfig[],
    date = new Date(),
): Array<{
    category: ActivityCategory;
    minutes: number;
}> {
    const totals = new Map<ActivityCategory, number>();

    getTodayActivities(activities, categories, date).forEach((item) => {
        totals.set(item.category, (totals.get(item.category) ?? 0) + item.durationMin);
    });

    const knownIds = new Set(categories.map((item) => item.id));
    const result = categories
        .map((item) => ({
            category: item.id,
            minutes: totals.get(item.id) ?? 0,
        }))
        .filter((item) => item.minutes > 0);

    totals.forEach((minutes, categoryId) => {
        if (!knownIds.has(categoryId) && minutes > 0) {
            result.push({ category: categoryId, minutes });
        }
    });

    return result.sort((a, b) => b.minutes - a.minutes);
}

export function getTotalXp(activities: Activity[]): number {
    return activities.reduce((sum, item) => sum + item.xp, 0);
}

export function getStreakDays(
    activities: Activity[],
    categories: ActivityCategoryConfig[],
): number {
    const daySet = new Set(
        activities.map((item) => getActivityAttributionDateKey(item, categories)),
    );
    let streak = 0;
    let cursor = new Date();

    while (daySet.has(formatDateKey(cursor))) {
        streak += 1;
        cursor = addDays(cursor, -1);
    }

    return streak;
}

export function getRecordDayCount(
    activities: Activity[],
    categories: ActivityCategoryConfig[],
): number {
    return new Set(activities.map((item) => getActivityAttributionDateKey(item, categories)))
        .size;
}

export function getActivitiesSortedDesc(activities: Activity[]): Activity[] {
    return [...activities].sort((a, b) =>
        getActivityStartAt(b).localeCompare(getActivityStartAt(a)),
    );
}
