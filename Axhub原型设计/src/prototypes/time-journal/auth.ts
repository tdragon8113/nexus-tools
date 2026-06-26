export type AuthUser = {
    id: string;
    displayName: string;
    account: string;
    avatarColor: string;
};

export type AuthSession = {
    user: AuthUser;
};

type StoredAccount = {
    account: string;
    password: string;
    displayName: string;
    avatarColor: string;
};

export const demoAuthSession: AuthSession = {
    user: {
        id: 'user-demo',
        displayName: '生活记录者',
        account: 'demo',
        avatarColor: '#0f3e17',
    },
};

export const demoLoginAccount = 'demo';
export const demoLoginPassword = '123456';

const accountAvatarColors = [
    '#0f3e17',
    '#2f6feb',
    '#7c3aed',
    '#d97706',
    '#db2777',
    '#0891b2',
] as const;

const mockAccountRegistry = new Map<string, StoredAccount>([
    [
        demoLoginAccount,
        {
            account: demoLoginAccount,
            password: demoLoginPassword,
            displayName: demoAuthSession.user.displayName,
            avatarColor: demoAuthSession.user.avatarColor,
        },
    ],
]);

function normalizeAccount(account: string): string {
    return account.trim().toLowerCase();
}

function pickAvatarColor(account: string): string {
    let hash = 0;
    for (let index = 0; index < account.length; index += 1) {
        hash = (hash + account.charCodeAt(index) * (index + 1)) % accountAvatarColors.length;
    }
    return accountAvatarColors[hash];
}

function validateAccount(account: string): string | null {
    const trimmedAccount = account.trim();
    if (!trimmedAccount) {
        return '请输入账户名';
    }
    if (trimmedAccount.length < 2) {
        return '账户名至少 2 个字符';
    }
    if (trimmedAccount.length > 20) {
        return '账户名最多 20 个字符';
    }
    if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(trimmedAccount)) {
        return '账户名仅支持中文、字母、数字和下划线';
    }
    return null;
}

function validatePassword(password: string): string | null {
    const trimmedPassword = password.trim();
    if (!trimmedPassword) {
        return '请输入密码';
    }
    if (trimmedPassword.length < 6) {
        return '密码至少 6 位';
    }
    return null;
}

function createSessionFromStored(stored: StoredAccount): AuthSession {
    return {
        user: {
            id: `user-${stored.account}`,
            displayName: stored.displayName,
            account: stored.account,
            avatarColor: stored.avatarColor,
        },
    };
}

export function getAccountAvatarLetter(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) {
        return '记';
    }
    return trimmed.slice(0, 1);
}

export function mockLoginWithPassword(account: string, password: string): AuthSession | string {
    const accountError = validateAccount(account);
    if (accountError) {
        return accountError;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
        return passwordError;
    }

    const accountKey = normalizeAccount(account);
    const stored = mockAccountRegistry.get(accountKey);
    if (!stored) {
        return '账户不存在，请先注册';
    }
    if (stored.password !== password.trim()) {
        return '密码不正确';
    }

    return createSessionFromStored(stored);
}

export function mockRegisterAccount(input: {
    account: string;
    password: string;
    confirmPassword: string;
    displayName?: string;
}): AuthSession | string {
    const accountError = validateAccount(input.account);
    if (accountError) {
        return accountError;
    }
    const passwordError = validatePassword(input.password);
    if (passwordError) {
        return passwordError;
    }
    if (!input.confirmPassword.trim()) {
        return '请再次输入密码';
    }
    if (input.password.trim() !== input.confirmPassword.trim()) {
        return '两次输入的密码不一致';
    }

    const trimmedAccount = input.account.trim();
    const accountKey = normalizeAccount(trimmedAccount);
    if (mockAccountRegistry.has(accountKey)) {
        return '该账户名已被注册';
    }

    const displayName = input.displayName?.trim() || trimmedAccount;
    const stored: StoredAccount = {
        account: trimmedAccount,
        password: input.password.trim(),
        displayName,
        avatarColor: pickAvatarColor(trimmedAccount),
    };
    mockAccountRegistry.set(accountKey, stored);
    return createSessionFromStored(stored);
}

export function mockChangePassword(input: {
    account: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}): true | string {
    const accountKey = normalizeAccount(input.account);
    const stored = mockAccountRegistry.get(accountKey);
    if (!stored) {
        return '账户不存在';
    }
    if (stored.password !== input.currentPassword.trim()) {
        return '当前密码不正确';
    }
    const passwordError = validatePassword(input.newPassword);
    if (passwordError) {
        return passwordError;
    }
    if (!input.confirmPassword.trim()) {
        return '请再次输入新密码';
    }
    if (input.newPassword.trim() !== input.confirmPassword.trim()) {
        return '两次输入的新密码不一致';
    }
    if (input.currentPassword.trim() === input.newPassword.trim()) {
        return '新密码不能与当前密码相同';
    }

    mockAccountRegistry.set(accountKey, {
        ...stored,
        password: input.newPassword.trim(),
    });
    return true;
}

export function isDemoAccount(session: AuthSession | null): boolean {
    return session?.user.account === demoLoginAccount;
}
