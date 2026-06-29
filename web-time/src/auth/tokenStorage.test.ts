import { beforeEach, describe, expect, it, vi } from 'vitest';
import { tokenStorage } from './tokenStorage';

function createStorage() {
    const store = new Map<string, string>();
    return {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
            store.set(key, value);
        },
        removeItem: (key: string) => {
            store.delete(key);
        },
        clear: () => {
            store.clear();
        },
    };
}

describe('tokenStorage', () => {
    beforeEach(() => {
        vi.stubGlobal('localStorage', createStorage());
    });

    it('stores and retrieves access and refresh tokens', () => {
        tokenStorage.setTokens('access-abc', 'refresh-xyz');
        expect(tokenStorage.getAccess()).toBe('access-abc');
        expect(tokenStorage.getRefresh()).toBe('refresh-xyz');
        expect(tokenStorage.hasTokens()).toBe(true);
    });

    it('clears both tokens', () => {
        tokenStorage.setTokens('access-abc', 'refresh-xyz');
        tokenStorage.clear();
        expect(tokenStorage.getAccess()).toBeNull();
        expect(tokenStorage.getRefresh()).toBeNull();
        expect(tokenStorage.hasTokens()).toBe(false);
    });
});
