import { hasNoteContent, sanitizeNoteHtml } from './noteRichText';

export type ActivityCategory = string;

export type ActivityCategoryConfig = {
    id: ActivityCategory;
    label: string;
    emoji: string;
    xpPerHour: number;
};

export type Activity = {
    id: string;
    category: ActivityCategory;
    title: string;
    durationMin: number;
    mood: 1 | 2 | 3 | 4 | 5;
    note?: string;
    xp: number;
    startedAt?: string;
    createdAt: string;
};

export type ReflectionScope = 'day' | 'month' | 'year';

export type Reflection = {
    id: string;
    scope: ReflectionScope;
    date: string;
    content: string;
};

export const ACTIVE_RECORDING_ID = 'active-recording';

export type ActiveRecordingSession = {
    category: ActivityCategory;
    title: string;
    startedAt: string;
};

export const SLEEP_CATEGORY_ID = 'sleep';
const SLEEP_DAY_ROLLOVER_HOUR = 6;
export const DAY_MINUTES = 24 * 60;

export const categoryTimelineColors: Record<string, string> = {
    work: '#1a5a24',
    study: '#2f6feb',
    exercise: '#d97706',
    social: '#7c3aed',
    sleep: '#4f46e5',
    rest: '#64748b',
    entertainment: '#db2777',
    other: '#78716c',
};

export const initialCategories: ActivityCategoryConfig[] = [
    { id: 'work', label: '工作', emoji: '💼', xpPerHour: 20 },
    { id: 'study', label: '学习', emoji: '📚', xpPerHour: 25 },
    { id: 'exercise', label: '运动', emoji: '🏃', xpPerHour: 30 },
    { id: 'social', label: '社交', emoji: '👥', xpPerHour: 18 },
    { id: 'sleep', label: '睡觉', emoji: '🛌', xpPerHour: 10 },
    { id: 'rest', label: '休息', emoji: '😴', xpPerHour: 10 },
    { id: 'entertainment', label: '娱乐', emoji: '🎮', xpPerHour: 12 },
    { id: 'other', label: '其他', emoji: '✨', xpPerHour: 15 },
];

export const moodLabels = ['很差', '一般', '还行', '不错', '很好'] as const;

const today = new Date();
const todayKey = formatDateKey(today);
const yesterdayKey = formatDateKey(addDays(today, -1));

/** 生成「已结束」的示例活动时间，结束于 now 之前 */
function buildPastActivityTimes(durationMin: number, endedMinutesAgo: number): {
    startedAt: string;
    createdAt: string;
} {
    const createdAt = new Date(Date.now() - endedMinutesAgo * 60000);
    const startedAt = new Date(createdAt.getTime() - durationMin * 60000);
    return {
        startedAt: startedAt.toISOString(),
        createdAt: createdAt.toISOString(),
    };
}

const todayExercise = buildPastActivityTimes(45, 420);
const todayStudyReading = buildPastActivityTimes(60, 330);
const todayWork = buildPastActivityTimes(90, 180);
const todayEntertainment = buildPastActivityTimes(40, 90);
const todayStudyWords = buildPastActivityTimes(25, 30);

export const initialActivities: Activity[] = [
    {
        id: 'a1',
        category: 'exercise',
        title: '晨跑',
        durationMin: 45,
        mood: 5,
        note: '天气很好，状态不错',
        xp: 23,
        ...todayExercise,
    },
    {
        id: 'a2',
        category: 'study',
        title: '阅读《深度工作》',
        durationMin: 60,
        mood: 4,
        xp: 25,
        ...todayStudyReading,
    },
    {
        id: 'a3',
        category: 'work',
        title: '整理周报',
        durationMin: 90,
        mood: 3,
        xp: 30,
        ...todayWork,
    },
    {
        id: 'a6',
        category: 'entertainment',
        title: '看剧放松',
        durationMin: 40,
        mood: 4,
        xp: 8,
        ...todayEntertainment,
    },
    {
        id: 'a7',
        category: 'study',
        title: '背单词',
        durationMin: 25,
        mood: 3,
        xp: 10,
        ...todayStudyWords,
    },
    {
        id: 'a4',
        category: 'social',
        title: '和朋友晚餐',
        durationMin: 120,
        mood: 5,
        xp: 36,
        startedAt: `${yesterdayKey}T17:00:00`,
        createdAt: `${yesterdayKey}T19:00:00`,
    },
    {
        id: 'a5',
        category: 'rest',
        title: '午休',
        durationMin: 30,
        mood: 4,
        xp: 5,
        startedAt: `${yesterdayKey}T12:00:00`,
        createdAt: `${yesterdayKey}T12:30:00`,
    },
    {
        id: 'a8',
        category: 'sleep',
        title: '夜间睡眠',
        durationMin: 480,
        mood: 4,
        xp: 80,
        startedAt: `${yesterdayKey}T23:00:00`,
        createdAt: `${todayKey}T07:00:00`,
    },
];

export const initialReflections: Reflection[] = [
    {
        id: 'r1',
        scope: 'day',
        date: todayKey,
        content: '今天运动完心情很好，下午工作效率也比平时高。晚上想早点休息。',
    },
    {
        id: 'r2',
        scope: 'day',
        date: yesterdayKey,
        content: '和朋友聊了很多，感觉社交也是生活很重要的一部分。',
    },
    {
        id: 'rm1',
        scope: 'month',
        date: todayKey.slice(0, 7),
        content:
            '这个月开始坚持运动，整体作息更规律了。工作上完成了两个重要节点，下个月想留出更多阅读时间。',
    },
    {
        id: 'ry1',
        scope: 'year',
        date: todayKey.slice(0, 4),
        content:
            '上半年在记录习惯上稳定了很多，也更清楚自己的时间花在哪里。下半年希望保持运动频率，并多写一些阶段性总结。',
    },
];

export function getCategoryMap(
    categories: ActivityCategoryConfig[],
): Record<ActivityCategory, ActivityCategoryConfig> {
    return Object.fromEntries(categories.map((item) => [item.id, item]));
}

export function getCategoryMeta(
    categories: ActivityCategoryConfig[],
    categoryId: ActivityCategory,
): ActivityCategoryConfig {
    const found = getCategoryMap(categories)[categoryId];
    if (found) {
        return found;
    }
    return { id: categoryId, label: '未知类型', emoji: '❓', xpPerHour: 15 };
}

export function getCategoryTimelineColor(categoryId: ActivityCategory): string {
    return categoryTimelineColors[categoryId] ?? categoryTimelineColors.other;
}

export function createCategoryId(
    label: string,
    categories: ActivityCategoryConfig[],
): string {
    const slug = label
        .trim()
        .toLowerCase()
        .replace(/[^\w]+/g, '-')
        .replace(/^-|-$/g, '');
    const base = slug || `cat-${Date.now()}`;
    if (!categories.some((item) => item.id === base)) {
        return base;
    }
    let index = 2;
    while (categories.some((item) => item.id === `${base}-${index}`)) {
        index += 1;
    }
    return `${base}-${index}`;
}

export function countActivitiesByCategory(
    activities: Activity[],
    categoryId: ActivityCategory,
): number {
    return activities.filter((item) => item.category === categoryId).length;
}

export function formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}

export function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) {
        return `${mins} 分钟`;
    }
    if (mins === 0) {
        return `${hours} 小时`;
    }
    return `${hours}h ${mins}m`;
}

export function formatElapsed(ms: number): string {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hours > 0) {
        return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function minutesBetween(start: Date, end: Date): number {
    const diffMs = Math.max(0, end.getTime() - start.getTime());
    return Math.max(1, Math.round(diffMs / 60000));
}

export function formatTimeLabel(iso: string): string {
    const date = new Date(iso);
    const hours = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${mins}`;
}

export function isActiveRecordingToday(
    session: ActiveRecordingSession,
    date = new Date(),
): boolean {
    return formatDateKey(new Date(session.startedAt)) === formatDateKey(date);
}

export function getActiveRecordingElapsedMs(
    session: ActiveRecordingSession,
    nowMs = Date.now(),
): number {
    return Math.max(0, nowMs - new Date(session.startedAt).getTime());
}

export function getActiveRecordingDurationMin(
    session: ActiveRecordingSession,
    nowMs = Date.now(),
): number {
    return Math.max(0, Math.floor(getActiveRecordingElapsedMs(session, nowMs) / 60000));
}

export function calculateXp(
    categories: ActivityCategoryConfig[],
    categoryId: ActivityCategory,
    durationMin: number,
): number {
    const rate = getCategoryMeta(categories, categoryId).xpPerHour;
    return Math.max(5, Math.round((durationMin / 60) * rate));
}

export function getLevelInfo(totalXp: number): {
    level: number;
    currentXp: number;
    nextLevelXp: number;
    progress: number;
} {
    const thresholds = [0, 80, 180, 320, 500, 720, 980, 1280, 1620, 2000];
    let level = 1;

    for (let index = 0; index < thresholds.length - 1; index += 1) {
        if (totalXp >= thresholds[index + 1]) {
            level = index + 2;
        } else {
            break;
        }
    }

    const currentThreshold = thresholds[level - 1] ?? 0;
    const nextThreshold = thresholds[level] ?? thresholds[thresholds.length - 1] + 400;
    const currentXp = totalXp - currentThreshold;
    const nextLevelXp = nextThreshold - currentThreshold;
    const progress = Math.min(100, Math.round((currentXp / nextLevelXp) * 100));

    return { level, currentXp, nextLevelXp, progress };
}

export function getTotalXp(activities: Activity[]): number {
    return activities.reduce((sum, item) => sum + item.xp, 0);
}

export function getActivityStartAt(activity: Activity): string {
    if (activity.startedAt) {
        return activity.startedAt;
    }
    const endedAt = new Date(activity.createdAt);
    return new Date(endedAt.getTime() - activity.durationMin * 60000).toISOString();
}

export function getActivityDayTimelineSegment(activity: Activity): {
    startMin: number;
    durationMin: number;
} {
    const start = new Date(getActivityStartAt(activity));
    return {
        startMin: start.getHours() * 60 + start.getMinutes(),
        durationMin: activity.durationMin,
    };
}

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
    const startAt = new Date(getActivityStartAt(activity));

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
    return new Set(activities.map((item) => getActivityAttributionDateKey(item, categories))).size;
}

export type RecordDaySummary = {
    dateKey: string;
    activityCount: number;
    totalMinutes: number;
};

export function getRecordDaySummaries(
    activities: Activity[],
    categories: ActivityCategoryConfig[],
): RecordDaySummary[] {
    const totals = new Map<string, { activityCount: number; totalMinutes: number }>();

    activities.forEach((item) => {
        const dateKey = getActivityAttributionDateKey(item, categories);
        const current = totals.get(dateKey) ?? { activityCount: 0, totalMinutes: 0 };
        totals.set(dateKey, {
            activityCount: current.activityCount + 1,
            totalMinutes: current.totalMinutes + item.durationMin,
        });
    });

    return Array.from(totals.entries())
        .map(([dateKey, summary]) => ({ dateKey, ...summary }))
        .sort((a, b) => b.dateKey.localeCompare(a.dateKey));
}

export function getActivitiesSortedDesc(activities: Activity[]): Activity[] {
    return [...activities].sort((a, b) =>
        getActivityStartAt(b).localeCompare(getActivityStartAt(a)),
    );
}

export function getReflectionScope(reflection: Reflection): ReflectionScope {
    return reflection.scope ?? 'day';
}

export function formatMonthKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

export function formatYearKey(date: Date): string {
    return String(date.getFullYear());
}

export function filterReflectionsByScope(
    reflections: Reflection[],
    scope: ReflectionScope,
): Reflection[] {
    return reflections.filter((item) => getReflectionScope(item) === scope);
}

export function getReflectionsSortedDesc(
    reflections: Reflection[],
    scope?: ReflectionScope,
): Reflection[] {
    const list = scope ? filterReflectionsByScope(reflections, scope) : reflections;
    return [...list].sort((a, b) => b.date.localeCompare(a.date));
}

export function formatReflectionPeriodLabel(reflection: Reflection, now = new Date()): string {
    const scope = getReflectionScope(reflection);
    if (scope === 'year') {
        return `${reflection.date} 年`;
    }
    if (scope === 'month') {
        const [year, month] = reflection.date.split('-');
        return `${year} 年 ${Number(month)} 月`;
    }
    return formatArchiveDateLabel(reflection.date, now);
}

export function getReflectionScopeLabel(scope: ReflectionScope): string {
    if (scope === 'month') {
        return '月总结';
    }
    if (scope === 'year') {
        return '年总结';
    }
    return '日感悟';
}

export function formatArchiveDateLabel(dateKey: string, now = new Date()): string {
    const todayKey = formatDateKey(now);
    const yesterdayKey = formatDateKey(addDays(now, -1));
    if (dateKey === todayKey) {
        return '今天';
    }
    if (dateKey === yesterdayKey) {
        return '昨天';
    }
    return dateKey;
}

export type StatsRangePreset =
    | 'today'
    | 'yesterday'
    | 'week'
    | 'month'
    | '7d'
    | '30d'
    | 'custom';

/** @deprecated Use StatsRangePreset */
export type StatsPeriod = '7d' | '30d' | 'month';

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

function getWeekStartMonday(date: Date): Date {
    const cursor = new Date(date);
    const weekday = cursor.getDay();
    const offset = weekday === 0 ? -6 : 1 - weekday;
    return addDays(cursor, offset);
}

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
    const endKey = clampDateKeyToToday(selection.customEndKey ?? todayKey, todayKey);
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

export function getStatsRangeBounds(
    selection: StatsRangeSelection,
    now = new Date(),
): StatsPeriodBounds {
    const normalized = normalizeStatsRangeSelection(selection, now);
    const endKey = formatDateKey(now);

    if (normalized.preset === 'today') {
        const previousKey = formatDateKey(addDays(now, -1));
        return {
            preset: 'today',
            label: '今天',
            previousLabel: '昨天',
            startKey: endKey,
            endKey,
            previousStartKey: previousKey,
            previousEndKey: previousKey,
            dayCount: 1,
        };
    }

    if (normalized.preset === 'yesterday') {
        const yesterdayDate = addDays(now, -1);
        const yesterdayKey = formatDateKey(yesterdayDate);
        const previousKey = formatDateKey(addDays(now, -2));
        return {
            preset: 'yesterday',
            label: '昨日',
            previousLabel: '前日',
            startKey: yesterdayKey,
            endKey: yesterdayKey,
            previousStartKey: previousKey,
            previousEndKey: previousKey,
            dayCount: 1,
        };
    }

    if (normalized.preset === 'week') {
        const weekStart = getWeekStartMonday(now);
        const startKey = formatDateKey(weekStart);
        const dayCount = countDaysInclusive(startKey, endKey);
        const previousWeekStart = addDays(weekStart, -7);
        const previousWeekEnd = addDays(previousWeekStart, dayCount - 1);

        return {
            preset: 'week',
            label: '本周',
            previousLabel: '上周',
            startKey,
            endKey,
            previousStartKey: formatDateKey(previousWeekStart),
            previousEndKey: formatDateKey(previousWeekEnd),
            dayCount,
        };
    }

    if (normalized.preset === '7d') {
        const startDate = addDays(now, -6);
        const previousEndDate = addDays(startDate, -1);
        const previousStartDate = addDays(previousEndDate, -6);
        return {
            preset: '7d',
            label: '近 7 天',
            previousLabel: '前 7 天',
            startKey: formatDateKey(startDate),
            endKey,
            previousStartKey: formatDateKey(previousStartDate),
            previousEndKey: formatDateKey(previousEndDate),
            dayCount: 7,
        };
    }

    if (normalized.preset === '30d') {
        const startDate = addDays(now, -29);
        const previousEndDate = addDays(startDate, -1);
        const previousStartDate = addDays(previousEndDate, -29);
        return {
            preset: '30d',
            label: '近 30 天',
            previousLabel: '前 30 天',
            startKey: formatDateKey(startDate),
            endKey,
            previousStartKey: formatDateKey(previousStartDate),
            previousEndKey: formatDateKey(previousEndDate),
            dayCount: 30,
        };
    }

    if (normalized.preset === 'custom') {
        const startKey = normalized.customStartKey ?? endKey;
        const customEndKey = normalized.customEndKey ?? endKey;
        const dayCount = countDaysInclusive(startKey, customEndKey);
        const previousEndDate = addDays(new Date(`${startKey}T12:00:00`), -1);
        const previousStartDate = addDays(previousEndDate, -(dayCount - 1));

        return {
            preset: 'custom',
            label: formatStatsRangeLabel(startKey, customEndKey),
            previousLabel: `前 ${dayCount} 天`,
            startKey,
            endKey: customEndKey,
            previousStartKey: formatDateKey(previousStartDate),
            previousEndKey: formatDateKey(previousEndDate),
            dayCount,
        };
    }

    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const dayCount = countDaysInclusive(formatDateKey(startDate), endKey);
    const previousEndDate = addDays(startDate, -1);
    const previousStartDate = addDays(previousEndDate, -(dayCount - 1));

    return {
        preset: 'month',
        label: '本月',
        previousLabel: '上月同期',
        startKey: formatDateKey(startDate),
        endKey,
        previousStartKey: formatDateKey(previousStartDate),
        previousEndKey: formatDateKey(previousEndDate),
        dayCount,
    };
}

/** @deprecated Use getStatsRangeBounds */
export function getStatsPeriodBounds(period: StatsPeriod, now = new Date()): StatsPeriodBounds {
    if (period === '7d') {
        return getStatsRangeBounds({ preset: '7d' }, now);
    }
    if (period === '30d') {
        return getStatsRangeBounds({ preset: '30d' }, now);
    }
    return getStatsRangeBounds({ preset: 'month' }, now);
}

export function calcStatsChangePercent(current: number, previous: number): number | null {
    if (previous === 0) {
        return current > 0 ? 100 : null;
    }
    return Math.round(((current - previous) / previous) * 100);
}

function isActivityInDateRange(
    activity: Activity,
    categories: ActivityCategoryConfig[],
    startKey: string,
    endKey: string,
): boolean {
    const day = getActivityAttributionDateKey(activity, categories);
    return day >= startKey && day <= endKey;
}

function sumMinutesInRange(
    activities: Activity[],
    categories: ActivityCategoryConfig[],
    startKey: string,
    endKey: string,
): number {
    return activities
        .filter((item) => isActivityInDateRange(item, categories, startKey, endKey))
        .reduce((sum, item) => sum + item.durationMin, 0);
}

function countDaysInclusive(startKey: string, endKey: string): number {
    let count = 0;
    let cursor = new Date(`${startKey}T12:00:00`);

    while (true) {
        count += 1;
        if (formatDateKey(cursor) >= endKey) {
            break;
        }
        cursor = addDays(cursor, 1);
    }

    return count;
}

export function getPeriodMetrics(
    activities: Activity[],
    categories: ActivityCategoryConfig[],
    startKey: string,
    endKey: string,
): StatsPeriodMetrics {
    const periodActivities = activities.filter((item) =>
        isActivityInDateRange(item, categories, startKey, endKey),
    );
    const totalMinutes = periodActivities.reduce((sum, item) => sum + item.durationMin, 0);
    const totalXp = periodActivities.reduce((sum, item) => sum + item.xp, 0);
    const recordDays = new Set(
        periodActivities.map((item) => getActivityAttributionDateKey(item, categories)),
    ).size;
    const daySpan = countDaysInclusive(startKey, endKey);
    const moodValues = periodActivities.map((item) => item.mood);

    return {
        totalMinutes,
        totalXp,
        recordDays,
        activityCount: periodActivities.length,
        avgMood:
            moodValues.length > 0
                ? Math.round(
                      (moodValues.reduce((sum, value) => sum + value, 0) / moodValues.length) * 10,
                  ) / 10
                : null,
        avgDailyMinutes: Math.round(totalMinutes / daySpan),
    };
}

export function getPeriodCategoryBreakdown(
    activities: Activity[],
    categories: ActivityCategoryConfig[],
    startKey: string,
    endKey: string,
    previousStartKey: string,
    previousEndKey: string,
): StatsCategoryBreakdown[] {
    const currentTotals = new Map<ActivityCategory, number>();
    const previousTotals = new Map<ActivityCategory, number>();

    activities.forEach((item) => {
        const day = getActivityAttributionDateKey(item, categories);
        if (day >= startKey && day <= endKey) {
            currentTotals.set(item.category, (currentTotals.get(item.category) ?? 0) + item.durationMin);
        }
        if (day >= previousStartKey && day <= previousEndKey) {
            previousTotals.set(
                item.category,
                (previousTotals.get(item.category) ?? 0) + item.durationMin,
            );
        }
    });

    const categoryIds = new Set([
        ...currentTotals.keys(),
        ...previousTotals.keys(),
        ...categories.map((item) => item.id),
    ]);

    return [...categoryIds]
        .map((category) => {
            const minutes = currentTotals.get(category) ?? 0;
            const previousMinutes = previousTotals.get(category) ?? 0;
            return {
                category,
                minutes,
                previousMinutes,
                changePercent: calcStatsChangePercent(minutes, previousMinutes),
            };
        })
        .filter((item) => item.minutes > 0 || item.previousMinutes > 0)
        .sort((a, b) => b.minutes - a.minutes);
}

function aggregateCategoryMinutes(
    activities: Activity[],
    categories: ActivityCategoryConfig[],
    startKey: string,
    endKey: string,
): Array<{ category: ActivityCategory; minutes: number }> {
    const totals = new Map<ActivityCategory, number>();
    activities.forEach((item) => {
        const day = getActivityAttributionDateKey(item, categories);
        if (day >= startKey && day <= endKey) {
            totals.set(item.category, (totals.get(item.category) ?? 0) + item.durationMin);
        }
    });

    return [...totals.entries()]
        .map(([category, minutes]) => ({ category, minutes }))
        .sort((a, b) => b.minutes - a.minutes);
}

function buildDailyBuckets(
    activities: Activity[],
    categories: ActivityCategoryConfig[],
    startKey: string,
    endKey: string,
): StatsChartBucket[] {
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const buckets: StatsChartBucket[] = [];
    const startDate = new Date(`${startKey}T12:00:00`);
    const endDate = new Date(`${endKey}T12:00:00`);

    for (let cursor = new Date(startDate); cursor <= endDate; cursor = addDays(cursor, 1)) {
        const key = formatDateKey(cursor);
        const minutes = sumMinutesInRange(activities, categories, key, key);
        buckets.push({
            id: key,
            label: weekdays[cursor.getDay()],
            subLabel: `${cursor.getMonth() + 1}/${cursor.getDate()}`,
            minutes,
            categories: aggregateCategoryMinutes(activities, categories, key, key),
        });
    }

    return buckets;
}

function buildGroupedBuckets(
    activities: Activity[],
    categories: ActivityCategoryConfig[],
    startKey: string,
    endKey: string,
    groupSize: number,
): StatsChartBucket[] {
    const buckets: StatsChartBucket[] = [];
    const startDate = new Date(`${startKey}T12:00:00`);
    const endDate = new Date(`${endKey}T12:00:00`);
    let cursor = new Date(startDate);
    let index = 1;

    while (cursor <= endDate) {
        const groupStart = new Date(cursor);
        const groupEnd = addDays(cursor, groupSize - 1);
        const boundedEnd = groupEnd > endDate ? endDate : groupEnd;
        const start = formatDateKey(groupStart);
        const end = formatDateKey(boundedEnd);
        const minutes = sumMinutesInRange(activities, categories, start, end);

        buckets.push({
            id: `${start}-${end}`,
            label: `段${index}`,
            subLabel: `${groupStart.getMonth() + 1}/${groupStart.getDate()}`,
            minutes,
            categories: aggregateCategoryMinutes(activities, categories, start, end),
        });

        cursor = addDays(boundedEnd, 1);
        index += 1;
    }

    return buckets;
}

function buildMonthWeekBuckets(
    activities: Activity[],
    categories: ActivityCategoryConfig[],
    startKey: string,
    endKey: string,
): StatsChartBucket[] {
    const buckets: StatsChartBucket[] = [];
    const startDate = new Date(`${startKey}T12:00:00`);
    const endDate = new Date(`${endKey}T12:00:00`);
    let cursor = new Date(startDate);
    let weekIndex = 1;

    while (cursor <= endDate) {
        const weekStart = new Date(cursor);
        const weekEnd = addDays(cursor, 6);
        const boundedEnd = weekEnd > endDate ? endDate : weekEnd;
        const start = formatDateKey(weekStart);
        const end = formatDateKey(boundedEnd);
        const minutes = sumMinutesInRange(activities, categories, start, end);

        buckets.push({
            id: `${start}-${end}`,
            label: `W${weekIndex}`,
            subLabel: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
            minutes,
            categories: aggregateCategoryMinutes(activities, categories, start, end),
        });

        cursor = addDays(boundedEnd, 1);
        weekIndex += 1;
    }

    return buckets;
}

export function getPeriodChartBuckets(
    activities: Activity[],
    categories: ActivityCategoryConfig[],
    bounds: StatsPeriodBounds,
): StatsChartBucket[] {
    if (bounds.dayCount <= 7) {
        return buildDailyBuckets(activities, categories, bounds.startKey, bounds.endKey);
    }

    if (bounds.dayCount <= 31) {
        const groupSize = Math.max(1, Math.ceil(bounds.dayCount / 7));
        return buildGroupedBuckets(
            activities,
            categories,
            bounds.startKey,
            bounds.endKey,
            groupSize,
        );
    }

    return buildGroupedBuckets(
        activities,
        categories,
        bounds.startKey,
        bounds.endKey,
        7,
    );
}

export function buildStatsInsight(
    bounds: StatsPeriodBounds,
    metrics: StatsPeriodMetrics,
    previousMetrics: StatsPeriodMetrics,
    categoryBreakdown: StatsCategoryBreakdown[],
    chartBuckets: StatsChartBucket[],
    categories: ActivityCategoryConfig[],
): string {
    if (metrics.totalMinutes === 0) {
        return `${bounds.label}还没有可统计的数据，开始记录后会在这里看到趋势与对比。`;
    }

    const topCategory = categoryBreakdown.find((item) => item.minutes > 0);
    const topLabel = topCategory
        ? getCategoryMeta(categories, topCategory.category).label
        : '';

    const minutesChange = calcStatsChangePercent(metrics.totalMinutes, previousMetrics.totalMinutes);
    const busiestBucket = [...chartBuckets].sort((a, b) => b.minutes - a.minutes)[0];
    const parts: string[] = [];

    if (topCategory) {
        parts.push(
            `${bounds.label}你在「${topLabel}」上投入最多，占 ${Math.round((topCategory.minutes / metrics.totalMinutes) * 100)}%。`,
        );
    }

    if (minutesChange !== null) {
        if (minutesChange > 0) {
            parts.push(`总时长比${bounds.previousLabel}多 ${minutesChange}%。`);
        } else if (minutesChange < 0) {
            parts.push(`总时长比${bounds.previousLabel}少 ${Math.abs(minutesChange)}%。`);
        } else {
            parts.push(`总时长与${bounds.previousLabel}持平。`);
        }
    }

    if (busiestBucket && busiestBucket.minutes > 0) {
        parts.push(
            `${busiestBucket.label}（${busiestBucket.subLabel}）最充实，记录了 ${formatDuration(busiestBucket.minutes)}。`,
        );
    }

    return parts.join('');
}

export function filterActivitiesForStats(
    activities: Activity[],
    excludeSleep: boolean,
): Activity[] {
    if (!excludeSleep) {
        return activities;
    }
    return activities.filter((item) => item.category !== SLEEP_CATEGORY_ID);
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
                new Date(getActivityStartAt(left)).getTime() -
                new Date(getActivityStartAt(right)).getTime(),
        );
}

export function getPeriodDayMarkers(
    activities: Activity[],
    categories: ActivityCategoryConfig[],
    startKey: string,
    endKey: string,
): Array<{ dateKey: string; weekday: string; subLabel: string; hasRecord: boolean }> {
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const recordDays = new Set(
        activities.map((item) => getActivityAttributionDateKey(item, categories)),
    );
    const markers: Array<{ dateKey: string; weekday: string; subLabel: string; hasRecord: boolean }> =
        [];
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

export function getTimeOfDaySegmentFromHour(hour: number): TimeOfDaySegmentId {
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

export function getActivityTimeOfDaySegment(activity: Activity): TimeOfDaySegmentId {
    const start = new Date(getActivityStartAt(activity));
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
        segmentTotals.set(segment, (segmentTotals.get(segment) ?? 0) + activity.durationMin);
        const categoryTotals = segmentCategories.get(segment) ?? new Map<ActivityCategory, number>();
        categoryTotals.set(
            activity.category,
            (categoryTotals.get(activity.category) ?? 0) + activity.durationMin,
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
};

export function buildActivityDayTrack(
    activities: Activity[],
    categories: ActivityCategoryConfig[],
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
        const startMs = new Date(getActivityStartAt(activity)).getTime();
        const endMs = new Date(activity.createdAt).getTime();
        const meta = getCategoryMeta(categories, activity.category);
        return {
            id: activity.id,
            category: activity.category,
            startMs,
            endMs,
            title: `${meta.label} ${formatTimeLabel(getActivityStartAt(activity))}–${formatTimeLabel(activity.createdAt)}`,
        };
    });

    const sorted = [...timelineItems].sort((left, right) => left.startMs - right.startMs);
    const windowStartMs = Math.min(...sorted.map((item) => item.startMs));
    const windowEndMs = Math.max(...sorted.map((item) => item.endMs));
    const spanMs = Math.max(windowEndMs - windowStartMs, 30 * 60 * 1000);
    const midMs = windowStartMs + spanMs / 2;

    return {
        segments: sorted.map((item) => ({
            id: item.id,
            category: item.category,
            left: ((item.startMs - windowStartMs) / spanMs) * 100,
            width: Math.max(1.5, ((item.endMs - item.startMs) / spanMs) * 100),
            color: getCategoryTimelineColor(item.category),
            title: item.title,
        })),
        axisStart: formatTimeLabel(new Date(windowStartMs).toISOString()),
        axisMid: formatTimeLabel(new Date(midMs).toISOString()),
        axisEnd: formatTimeLabel(new Date(windowEndMs).toISOString()),
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
            const track = buildActivityDayTrack(dayActivities, categories);
            const minutes = dayActivities.reduce((sum, item) => sum + item.durationMin, 0);

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

export function getWeekCategoryStats(
    activities: Activity[],
    categories: ActivityCategoryConfig[],
): Array<{
    category: ActivityCategory;
    minutes: number;
}> {
    const start = addDays(new Date(), -6);
    const startKey = formatDateKey(start);
    const totals = new Map<ActivityCategory, number>();

    activities.forEach((item) => {
        const day = getActivityAttributionDateKey(item, categories);
        if (day < startKey) {
            return;
        }
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

export function getWeekDailyMinutes(
    activities: Activity[],
    categories: ActivityCategoryConfig[],
): Array<{ label: string; minutes: number }> {
    const result: Array<{ label: string; minutes: number }> = [];
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

    for (let offset = 6; offset >= 0; offset -= 1) {
        const date = addDays(new Date(), -offset);
        const key = formatDateKey(date);
        const minutes = activities
            .filter((item) => getActivityAttributionDateKey(item, categories) === key)
            .reduce((sum, item) => sum + item.durationMin, 0);
        result.push({
            label: weekdays[date.getDay()],
            minutes,
        });
    }

    return result;
}

export function createActivity(
    input: {
        category: ActivityCategory;
        title: string;
        durationMin: number;
        mood: 1 | 2 | 3 | 4 | 5;
        note?: string;
        startedAt?: Date;
        endedAt?: Date;
    },
    categories: ActivityCategoryConfig[],
): Activity {
    const meta = getCategoryMeta(categories, input.category);
    const endedAt = input.endedAt ?? new Date();
    const startedAt =
        input.startedAt ??
        new Date(endedAt.getTime() - input.durationMin * 60000);
    return {
        id: `a-${endedAt.getTime()}`,
        category: input.category,
        title: input.title.trim() || meta.label,
        durationMin: input.durationMin,
        mood: input.mood,
        note: input.note && hasNoteContent(input.note) ? sanitizeNoteHtml(input.note) : undefined,
        xp: calculateXp(categories, input.category, input.durationMin),
        startedAt: startedAt.toISOString(),
        createdAt: endedAt.toISOString(),
    };
}
