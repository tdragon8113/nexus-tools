import { hasNoteContent, sanitizeNoteHtml } from './noteRichText';
import { formatApiDateTime, formatTimeLabel, parseApiDateTime } from './datetime';
import type { Activity, ActivityCategory, ActivityCategoryConfig } from './types';

export const moodLabels = ['很差', '一般', '还行', '不错', '很好'] as const;

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

export function getCategoryTimelineColor(categoryId: string): string {
    return categoryTimelineColors[categoryId] ?? categoryTimelineColors.other;
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

export function getCategoryMeta(
    categories: ActivityCategoryConfig[],
    categoryId: ActivityCategory,
): ActivityCategoryConfig {
    const found = categories.find((item) => item.id === categoryId);
    if (found) {
        return found;
    }
    return { id: categoryId, label: '未知类型', emoji: '❓', xpPerHour: 15 };
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

/** 将 YYYY-MM-DD 与 HH:mm 合并为本地 Date */
export function combineDateKeyAndTime(dateKey: string, time: string): Date {
    const [year, month, day] = dateKey.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

export { formatApiDateTime, formatTimeLabel, parseApiDateTime } from './datetime';

export function calculateXp(
    categories: ActivityCategoryConfig[],
    categoryId: ActivityCategory,
    durationMin: number,
): number {
    const rate = getCategoryMeta(categories, categoryId).xpPerHour;
    return Math.max(5, Math.round((durationMin / 60) * rate));
}

export function getActivityStartAt(activity: Activity): string {
    if (activity.startedAt) {
        return activity.startedAt;
    }
    const endedAt = parseApiDateTime(getActivityEndAt(activity));
    return formatApiDateTime(new Date(endedAt.getTime() - activity.durationMin * 60000));
}

export function getActivityEndAt(activity: Activity, referenceMs = Date.now()): string {
    if (activity.endedAt) {
        return activity.endedAt;
    }
    if (activity.startedAt) {
        return formatApiDateTime(new Date(referenceMs));
    }
    return activity.createdAt;
}

export function getActivityTimeRangeMs(
    activity: Activity,
    referenceMs = Date.now(),
): { startMs: number; endMs: number } {
    const startMs = parseApiDateTime(getActivityStartAt(activity)).getTime();
    const endMs = parseApiDateTime(getActivityEndAt(activity, referenceMs)).getTime();
    return { startMs, endMs: Math.max(endMs, startMs) };
}

/** 半开区间 [start, end)：首尾相接不算重叠 */
export function doTimeRangesOverlap(
    startMs: number,
    endMs: number,
    otherStartMs: number,
    otherEndMs: number,
): boolean {
    return startMs < otherEndMs && otherStartMs < endMs;
}

export function findOverlappingActivities(
    activities: Activity[],
    startMs: number,
    endMs: number,
    excludeActivityId?: string,
): Activity[] {
    return activities.filter((activity) => {
        if (excludeActivityId && activity.id === excludeActivityId) {
            return false;
        }
        const range = getActivityTimeRangeMs(activity);
        return doTimeRangesOverlap(startMs, endMs, range.startMs, range.endMs);
    });
}

export function formatActivityTimeRangeLabel(
    activity: Activity,
    categories: ActivityCategoryConfig[],
    referenceMs = Date.now(),
): string {
    const meta = getCategoryMeta(categories, activity.category);
    const start = formatTimeLabel(getActivityStartAt(activity));
    const end = formatTimeLabel(getActivityEndAt(activity, referenceMs));
    return `${meta.emoji} ${activity.title}（${start}–${end}）`;
}

export function getBackfillRangeError(
    dateKey: string,
    startTime: string,
    endTime: string,
    now = new Date(),
): string | null {
    const startedAt = combineDateKeyAndTime(dateKey, startTime);
    const endedAt = combineDateKeyAndTime(dateKey, endTime);

    if (startedAt.getTime() >= endedAt.getTime()) {
        return '开始时间不能大于结束时间';
    }
    if (endedAt.getTime() > now.getTime()) {
        return '不能补录未来的时间';
    }
    return null;
}

export function buildDraftActivity(input: {
    category: ActivityCategory;
    title: string;
    durationMin: number;
    mood: 1 | 2 | 3 | 4 | 5;
    note?: string;
    startedAt: Date;
    endedAt: Date;
    id?: string;
}): Activity {
    const endedAtValue = formatApiDateTime(input.endedAt);
    return {
        id: input.id ?? `draft-${endedAtValue}`,
        category: input.category,
        title: input.title,
        durationMin: input.durationMin,
        mood: input.mood,
        note: input.note && hasNoteContent(input.note) ? sanitizeNoteHtml(input.note) : undefined,
        xp: 0,
        startedAt: formatApiDateTime(input.startedAt),
        endedAt: endedAtValue,
        createdAt: endedAtValue,
    };
}
