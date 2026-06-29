import { formatDateKey, parseApiDateTime } from './record';
import type { Activity, ActivityCategory } from './types';

export const ACTIVE_RECORDING_ID = 'active-recording';

export type ActiveRecordingSession = {
    activityId: string;
    category: ActivityCategory;
    title: string;
    startedAt: string;
};

export function buildActiveRecordingSession(ongoing: Activity | null): ActiveRecordingSession | null {
    if (!ongoing || ongoing.endedAt) {
        return null;
    }
    return {
        activityId: ongoing.id,
        category: ongoing.category,
        title: ongoing.title,
        startedAt: ongoing.startedAt ?? ongoing.createdAt,
    };
}

export function isActiveRecordingToday(
    session: ActiveRecordingSession,
    date = new Date(),
): boolean {
    return formatDateKey(parseApiDateTime(session.startedAt)) === formatDateKey(date);
}

export function getActiveRecordingElapsedMs(
    session: ActiveRecordingSession,
    nowMs = Date.now(),
): number {
    return Math.max(0, nowMs - parseApiDateTime(session.startedAt).getTime());
}

export function getActiveRecordingDurationMin(
    session: ActiveRecordingSession,
    nowMs = Date.now(),
): number {
    return Math.max(0, Math.floor(getActiveRecordingElapsedMs(session, nowMs) / 60000));
}
