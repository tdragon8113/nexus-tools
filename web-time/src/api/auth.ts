import { tokenStorage } from '../auth/tokenStorage';
import { apiRequest, apiRequestVoid } from './client';
import type {
    ChangePasswordRequest,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UpdateProfileRequest,
    UserResponse,
} from './types';

export async function login(input: LoginRequest): Promise<TokenResponse> {
    const data = await apiRequest<TokenResponse>('/api/auth/login', {
        method: 'POST',
        body: input,
        skipAuth: true,
    });
    tokenStorage.setTokens(data.accessToken, data.refreshToken);
    return data;
}

export async function register(input: RegisterRequest): Promise<UserResponse> {
    return apiRequest<UserResponse>('/api/auth/register', {
        method: 'POST',
        body: input,
        skipAuth: true,
    });
}

export async function logout(): Promise<void> {
    const refreshToken = tokenStorage.getRefresh();
    try {
        if (refreshToken) {
            await apiRequestVoid('/api/auth/logout', {
                method: 'POST',
                body: { refreshToken },
                skipAuth: true,
            });
        }
    } finally {
        tokenStorage.clear();
    }
}

export async function getMe(): Promise<UserResponse> {
    return apiRequest<UserResponse>('/api/auth/me');
}

export async function updateProfile(input: UpdateProfileRequest): Promise<UserResponse> {
    return apiRequest<UserResponse>('/api/auth/me', {
        method: 'PATCH',
        body: input,
    });
}

export async function changePassword(input: ChangePasswordRequest): Promise<void> {
    await apiRequestVoid('/api/auth/password', {
        method: 'PATCH',
        body: input,
    });
}
