import { apiRequest } from './client';
import type { ActivityAnalyticsResponse, ActivitySummaryResponse, AnalyticsQuery } from './types';

export async function getAnalytics(query: AnalyticsQuery = {}): Promise<ActivityAnalyticsResponse> {
    const params = new URLSearchParams();
    if (query.preset) params.set('preset', query.preset);
    if (query.customStartKey) params.set('customStartKey', query.customStartKey);
    if (query.customEndKey) params.set('customEndKey', query.customEndKey);
    if (query.excludeSleep !== undefined) {
        params.set('excludeSleep', String(query.excludeSleep));
    }
    const queryString = params.toString();
    const path = queryString
        ? `/api/activities/analytics?${queryString}`
        : '/api/activities/analytics';
    return apiRequest<ActivityAnalyticsResponse>(path);
}

export async function getSummary(): Promise<ActivitySummaryResponse> {
    return apiRequest<ActivitySummaryResponse>('/api/activities/summary');
}
