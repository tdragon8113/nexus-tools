export type ApiResponse<T> = {
    code: number;
    message: string;
    data: T;
};

export type UserResponse = {
    id: number;
    username: string;
    email: string;
    nickname: string | null;
    avatarUrl: string | null;
};

export type TokenResponse = {
    accessToken: string;
    refreshToken: string;
    user?: UserResponse;
};

export type LoginRequest = {
    username: string;
    password: string;
};

export type RegisterRequest = {
    username: string;
    password: string;
    email?: string;
    nickname?: string;
};

export type RefreshTokenRequest = {
    refreshToken: string;
};

export type UpdateProfileRequest = {
    nickname: string;
};

export type ChangePasswordRequest = {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
};

export type ActivityResponse = {
    id: number;
    title: string;
    category: string;
    startTime: string;
    endTime: string | null;
    durationMinutes: number | null;
    mood: number | null;
    xp: number | null;
    notes: string | null;
    createdAt: string;
};

export type CreateActivityRequest = {
    title: string;
    category: string;
    startTime: string;
    endTime?: string | null;
    durationMinutes?: number | null;
    mood?: number | null;
    xp?: number | null;
    notes?: string | null;
};

export type UpdateActivityRequest = {
    title?: string;
    category?: string;
    endTime?: string | null;
    durationMinutes?: number | null;
    mood?: number | null;
    xp?: number | null;
    notes?: string | null;
};

export type ActivityCategoryResponse = {
    id: string;
    label: string;
    emoji: string;
    xpPerHour: number;
    sortOrder: number;
};

export type SaveActivityCategoryRequest = {
    id: string;
    label: string;
    emoji: string;
    xpPerHour: number;
    sortOrder?: number;
};

export type ReflectionResponse = {
    id: number;
    scope: string;
    periodKey: string;
    content: string;
    createdAt: string;
    updatedAt: string;
};

export type UpsertReflectionRequest = {
    scope: string;
    periodKey: string;
    content: string;
};

export type ActivitySummaryResponse = {
    totalXp: number;
    level: number;
    levelProgress: number;
    recordDays: number;
    streak: number;
};

export type StatsMetrics = {
    totalMinutes: number;
    totalXp: number;
    recordDays: number;
    activityCount: number;
    avgMood: number | null;
    avgDailyMinutes: number;
};

export type StatsBounds = {
    preset: string;
    label: string;
    previousLabel: string;
    startKey: string;
    endKey: string;
    previousStartKey: string;
    previousEndKey: string;
    dayCount: number;
};

export type StatsCategoryBreakdown = {
    category: string;
    minutes: number;
    previousMinutes: number;
    changePercent: number | null;
};

export type CategoryMinutes = {
    category: string;
    minutes: number;
};

export type StatsChartBucket = {
    id: string;
    label: string;
    subLabel: string;
    minutes: number;
    categories: CategoryMinutes[];
};

export type StatsDayMarker = {
    dateKey: string;
    weekday: string;
    subLabel: string;
    hasRecord: boolean;
};

export type ActivityAnalyticsResponse = {
    bounds: StatsBounds;
    metrics: StatsMetrics;
    previousMetrics: StatsMetrics;
    totalChange: number | null;
    avgChange: number | null;
    xpChange: number | null;
    categoryBreakdown: StatsCategoryBreakdown[];
    chartBuckets: StatsChartBucket[];
    dayMarkers: StatsDayMarker[];
    streak: number;
    insight: string;
    moodLabel: string;
    rangeLabel: string;
};

export type AnalyticsQuery = {
    preset?: string;
    customStartKey?: string;
    customEndKey?: string;
    excludeSleep?: boolean;
};
