import { tokenStorage } from '../auth/tokenStorage';
import type { ApiResponse, RefreshTokenRequest, TokenResponse } from './types';

export class ApiError extends Error {
    readonly status: number;
    readonly code: number;

    constructor(message: string, status: number, code: number) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
    }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
    body?: unknown;
    skipAuth?: boolean;
    skipRefresh?: boolean;
};

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
    const refreshToken = tokenStorage.getRefresh();
    if (!refreshToken) {
        tokenStorage.clear();
        return false;
    }

    const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken } satisfies RefreshTokenRequest),
    });

    if (!response.ok) {
        tokenStorage.clear();
        return false;
    }

    const payload = (await response.json()) as ApiResponse<TokenResponse>;
    if (payload.code !== 200 || !payload.data?.accessToken || !payload.data.refreshToken) {
        tokenStorage.clear();
        return false;
    }

    tokenStorage.setTokens(payload.data.accessToken, payload.data.refreshToken);
    return true;
}

async function ensureRefreshed(): Promise<boolean> {
    if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null;
        });
    }
    return refreshPromise;
}

async function parseResponse<T>(response: Response): Promise<T> {
    const payload = (await response.json()) as ApiResponse<T>;
    if (!response.ok || payload.code !== 200) {
        throw new ApiError(payload.message || '请求失败', response.status, payload.code);
    }
    return payload.data;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { body, skipAuth = false, skipRefresh = false, headers, ...rest } = options;

    const requestHeaders = new Headers(headers);
    if (body !== undefined && !requestHeaders.has('Content-Type')) {
        requestHeaders.set('Content-Type', 'application/json');
    }

    if (!skipAuth) {
        const accessToken = tokenStorage.getAccess();
        if (accessToken) {
            requestHeaders.set('Authorization', `Bearer ${accessToken}`);
        }
    }

    const response = await fetch(path, {
        ...rest,
        headers: requestHeaders,
        body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (response.status === 401 && !skipAuth && !skipRefresh) {
        const refreshed = await ensureRefreshed();
        if (refreshed) {
            return apiRequest<T>(path, { ...options, skipRefresh: true });
        }
        throw new ApiError('未授权', 401, 401);
    }

    return parseResponse<T>(response);
}

export async function apiRequestVoid(path: string, options: RequestOptions = {}): Promise<void> {
    await apiRequest<null>(path, options);
}
