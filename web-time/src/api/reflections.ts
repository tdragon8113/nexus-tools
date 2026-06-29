import { apiRequest, apiRequestVoid } from './client';
import type { ReflectionResponse, UpsertReflectionRequest } from './types';

export async function listReflections(): Promise<ReflectionResponse[]> {
    return apiRequest<ReflectionResponse[]>('/api/reflections');
}

export async function upsertReflection(input: UpsertReflectionRequest): Promise<ReflectionResponse> {
    return apiRequest<ReflectionResponse>('/api/reflections', {
        method: 'PUT',
        body: input,
    });
}

export async function deleteReflection(id: number): Promise<void> {
    await apiRequestVoid(`/api/reflections/${id}`, { method: 'DELETE' });
}
