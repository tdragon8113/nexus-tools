export type ActivityCategory = string;

export type ActivityCategoryConfig = {
    id: ActivityCategory;
    label: string;
    emoji: string;
    xpPerHour: number;
    sortOrder?: number;
};

export type Activity = {
    id: string;
    category: ActivityCategory;
    title: string;
    durationMin: number;
    mood: 1 | 2 | 3 | 4 | 5;
    note?: string;
    xp: number;
    startedAt?: string;
    endedAt?: string;
    createdAt: string;
};

export type ReflectionScope = 'day' | 'month' | 'year';

export type Reflection = {
    id: string;
    scope: ReflectionScope;
    date: string;
    content: string;
};

export type AuthUser = {
    id: string;
    displayName: string;
    account: string;
    avatarColor: string;
};

export type AuthSession = {
    user: AuthUser;
};

export type ActivitySummary = {
    totalXp: number;
    level: number;
    levelProgress: number;
    recordDays: number;
    streak: number;
};
