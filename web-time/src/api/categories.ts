import { apiRequest, apiRequestVoid } from './client';
import type { ActivityCategoryResponse, SaveActivityCategoryRequest } from './types';

export async function listCategories(): Promise<ActivityCategoryResponse[]> {
    return apiRequest<ActivityCategoryResponse[]>('/api/activity-categories');
}

export async function addCategory(
    input: SaveActivityCategoryRequest,
): Promise<ActivityCategoryResponse> {
    return apiRequest<ActivityCategoryResponse>('/api/activity-categories', {
        method: 'POST',
        body: input,
    });
}

export async function updateCategory(
    slug: string,
    input: SaveActivityCategoryRequest,
): Promise<ActivityCategoryResponse> {
    return apiRequest<ActivityCategoryResponse>(`/api/activity-categories/${slug}`, {
        method: 'PATCH',
        body: input,
    });
}

export async function deleteCategory(slug: string): Promise<void> {
    await apiRequestVoid(`/api/activity-categories/${slug}`, { method: 'DELETE' });
}

export async function resetCategories(): Promise<ActivityCategoryResponse[]> {
    return apiRequest<ActivityCategoryResponse[]>('/api/activity-categories/reset-defaults', {
        method: 'POST',
    });
}
