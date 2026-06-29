const ACCESS = 'tj.accessToken';
const REFRESH = 'tj.refreshToken';

export const tokenStorage = {
    getAccess: () => localStorage.getItem(ACCESS),
    getRefresh: () => localStorage.getItem(REFRESH),
    setTokens: (access: string, refresh: string) => {
        localStorage.setItem(ACCESS, access);
        localStorage.setItem(REFRESH, refresh);
    },
    clear: () => {
        localStorage.removeItem(ACCESS);
        localStorage.removeItem(REFRESH);
    },
    hasTokens: () => Boolean(localStorage.getItem(ACCESS)),
};
