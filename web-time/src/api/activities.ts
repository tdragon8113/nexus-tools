import { apiRequest, apiRequestVoid } from './client';
import type {
    ActivityResponse,
    CreateActivityRequest,
    UpdateActivityRequest,
} from './types';

export async function listActivities(from?: string, to?: string): Promise<ActivityResponse[]> {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const query = params.toString();
    const path = query ? `/api/activities?${query}` : '/api/activities';
    return apiRequest<ActivityResponse[]>(path);
}

export async function getOngoingActivity(): Promise<ActivityResponse | null> {
    return apiRequest<ActivityResponse | null>('/api/activities/ongoing');
}

export async function createActivity(input: CreateActivityRequest): Promise<ActivityResponse> {
    return apiRequest<ActivityResponse>('/api/activities', {
        method: 'POST',
        body: input,
    });
}

export async function updateActivity(
    id: number,
    input: UpdateActivityRequest,
): Promise<ActivityResponse> {
    return apiRequest<ActivityResponse>(`/api/activities/${id}`, {
        method: 'PATCH',
        body: input,
    });
}

export async function deleteActivity(id: number): Promise<void> {
    await apiRequestVoid(`/api/activities/${id}`, { method: 'DELETE' });
}
