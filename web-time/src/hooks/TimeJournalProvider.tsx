import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import * as activitiesApi from '../api/activities';
import * as analyticsApi from '../api/analytics';
import * as authApi from '../api/auth';
import * as categoriesApi from '../api/categories';
import { ApiError } from '../api/client';
import {
    mapActivities,
    mapActivity,
    mapAuthSession,
    mapCategories,
    mapCategory,
    mapReflection,
    mapReflections,
    mapSummary,
} from '../api/mappers';
import * as reflectionsApi from '../api/reflections';
import type {
    CreateActivityRequest,
    SaveActivityCategoryRequest,
    UpdateActivityRequest,
    UpsertReflectionRequest,
} from '../api/types';
import { tokenStorage } from '../auth/tokenStorage';
import type {
    Activity,
    ActivityCategoryConfig,
    ActivitySummary,
    AuthSession,
    Reflection,
} from '../domain/types';

type TimeJournalContextValue = {
    authSession: AuthSession | null;
    categories: ActivityCategoryConfig[];
    activities: Activity[];
    reflections: Reflection[];
    ongoing: Activity | null;
    summary: ActivitySummary | null;
    loading: boolean;
    error: string | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    register: (input: {
        username: string;
        password: string;
        email?: string;
        nickname?: string;
    }) => Promise<void>;
    refreshAll: () => Promise<void>;
    saveActivity: (input: CreateActivityRequest) => Promise<Activity>;
    updateActivity: (id: string, input: UpdateActivityRequest) => Promise<Activity>;
    deleteActivity: (id: string) => Promise<void>;
    upsertReflection: (input: UpsertReflectionRequest) => Promise<Reflection>;
    deleteReflection: (id: string) => Promise<void>;
    addCategory: (input: SaveActivityCategoryRequest) => Promise<ActivityCategoryConfig>;
    updateCategory: (
        slug: string,
        input: SaveActivityCategoryRequest,
    ) => Promise<ActivityCategoryConfig>;
    deleteCategory: (slug: string) => Promise<void>;
    resetCategories: () => Promise<ActivityCategoryConfig[]>;
    clearError: () => void;
    refreshData: (targets: DataRefreshTarget[]) => Promise<void>;
};

export type DataRefreshTarget =
    | 'session'
    | 'categories'
    | 'activities'
    | 'ongoing'
    | 'reflections'
    | 'summary';

export type TimeJournalRefreshApi = Pick<TimeJournalContextValue, 'refreshData'>;

const TimeJournalContext = createContext<TimeJournalContextValue | null>(null);

function toErrorMessage(error: unknown): string {
    if (error instanceof ApiError) {
        return error.message;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return '请求失败，请稍后重试';
}

export function TimeJournalProvider({ children }: { children: ReactNode }) {
    const [authSession, setAuthSession] = useState<AuthSession | null>(null);
    const [categories, setCategories] = useState<ActivityCategoryConfig[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [reflections, setReflections] = useState<Reflection[]>([]);
    const [ongoing, setOngoing] = useState<Activity | null>(null);
    const [summary, setSummary] = useState<ActivitySummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const clearError = useCallback(() => setError(null), []);

    const refreshAll = useCallback(async () => {
        if (!tokenStorage.hasTokens()) {
            setAuthSession(null);
            setCategories([]);
            setActivities([]);
            setReflections([]);
            setOngoing(null);
            setSummary(null);
            return;
        }

        const [user, categoryRows, activityRows, reflectionRows, ongoingRow, summaryRow] =
            await Promise.all([
                authApi.getMe(),
                categoriesApi.listCategories(),
                activitiesApi.listActivities(),
                reflectionsApi.listReflections(),
                activitiesApi.getOngoingActivity(),
                analyticsApi.getSummary(),
            ]);

        setAuthSession(mapAuthSession(user));
        setCategories(mapCategories(categoryRows));
        setActivities(mapActivities(activityRows));
        setReflections(mapReflections(reflectionRows));
        setOngoing(ongoingRow ? mapActivity(ongoingRow) : null);
        setSummary(mapSummary(summaryRow));
    }, []);

    const refreshData = useCallback(async (targets: DataRefreshTarget[]) => {
        if (!tokenStorage.hasTokens()) {
            return;
        }

        const unique = [...new Set(targets)];
        const jobs: Promise<void>[] = [];

        if (unique.includes('session')) {
            jobs.push(
                authApi.getMe().then((user) => {
                    setAuthSession(mapAuthSession(user));
                }),
            );
        }
        if (unique.includes('categories')) {
            jobs.push(
                categoriesApi.listCategories().then((rows) => {
                    setCategories(mapCategories(rows));
                }),
            );
        }
        if (unique.includes('activities')) {
            jobs.push(
                activitiesApi.listActivities().then((rows) => {
                    setActivities(mapActivities(rows));
                }),
            );
        }
        if (unique.includes('ongoing')) {
            jobs.push(
                activitiesApi.getOngoingActivity().then((row) => {
                    setOngoing(row ? mapActivity(row) : null);
                }),
            );
        }
        if (unique.includes('reflections')) {
            jobs.push(
                reflectionsApi.listReflections().then((rows) => {
                    setReflections(mapReflections(rows));
                }),
            );
        }
        if (unique.includes('summary')) {
            jobs.push(
                analyticsApi.getSummary().then((row) => {
                    setSummary(mapSummary(row));
                }),
            );
        }

        await Promise.all(jobs);
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function bootstrap() {
            if (!tokenStorage.hasTokens()) {
                setLoading(false);
                return;
            }

            try {
                await refreshAll();
            } catch (bootstrapError) {
                if (!cancelled) {
                    tokenStorage.clear();
                    setAuthSession(null);
                    setError(toErrorMessage(bootstrapError));
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void bootstrap();
        return () => {
            cancelled = true;
        };
    }, [refreshAll]);

    const login = useCallback(
        async (username: string, password: string) => {
            setError(null);
            try {
                const tokenResponse = await authApi.login({ username, password });
                if (tokenResponse.user) {
                    setAuthSession(mapAuthSession(tokenResponse.user));
                }
                await refreshAll();
            } catch (loginError) {
                setError(toErrorMessage(loginError));
                throw loginError;
            }
        },
        [refreshAll],
    );

    const logout = useCallback(async () => {
        setError(null);
        try {
            await authApi.logout();
        } catch {
            tokenStorage.clear();
        } finally {
            setAuthSession(null);
            setCategories([]);
            setActivities([]);
            setReflections([]);
            setOngoing(null);
            setSummary(null);
        }
    }, []);

    const register = useCallback(
        async (input: {
            username: string;
            password: string;
            email?: string;
            nickname?: string;
        }) => {
            setError(null);
            try {
                await authApi.register(input);
                await authApi.login({ username: input.username, password: input.password });
                await refreshAll();
            } catch (registerError) {
                setError(toErrorMessage(registerError));
                throw registerError;
            }
        },
        [refreshAll],
    );

    const saveActivity = useCallback(
        async (input: CreateActivityRequest) => {
            const created = await activitiesApi.createActivity(input);
            const activity = mapActivity(created);
            setActivities((current) => [activity, ...current]);
            if (!created.endTime) {
                setOngoing(activity);
            }
            const summaryRow = await analyticsApi.getSummary();
            setSummary(mapSummary(summaryRow));
            return activity;
        },
        [],
    );

    const updateActivity = useCallback(async (id: string, input: UpdateActivityRequest) => {
        const updated = await activitiesApi.updateActivity(Number(id), input);
        const activity = mapActivity(updated);
        setActivities((current) =>
            current.map((item) => (item.id === id ? activity : item)),
        );
        setOngoing(updated.endTime ? null : activity);
        const summaryRow = await analyticsApi.getSummary();
        setSummary(mapSummary(summaryRow));
        return activity;
    }, []);

    const deleteActivity = useCallback(async (id: string) => {
        await activitiesApi.deleteActivity(Number(id));
        setActivities((current) => current.filter((item) => item.id !== id));
        setOngoing((current) => (current?.id === id ? null : current));
        const summaryRow = await analyticsApi.getSummary();
        setSummary(mapSummary(summaryRow));
    }, []);

    const upsertReflection = useCallback(async (input: UpsertReflectionRequest) => {
        const saved = await reflectionsApi.upsertReflection(input);
        const reflection = mapReflection(saved);
        setReflections((current) => {
            const index = current.findIndex(
                (item) => item.scope === reflection.scope && item.date === reflection.date,
            );
            if (index === -1) {
                return [reflection, ...current];
            }
            const next = [...current];
            next[index] = reflection;
            return next;
        });
        return reflection;
    }, []);

    const deleteReflection = useCallback(async (id: string) => {
        await reflectionsApi.deleteReflection(Number(id));
        setReflections((current) => current.filter((item) => item.id !== id));
    }, []);

    const addCategory = useCallback(async (input: SaveActivityCategoryRequest) => {
        const created = await categoriesApi.addCategory(input);
        const category = mapCategory(created);
        setCategories((current) => [...current, category]);
        return category;
    }, []);

    const updateCategory = useCallback(
        async (slug: string, input: SaveActivityCategoryRequest) => {
            const updated = await categoriesApi.updateCategory(slug, input);
            const category = mapCategory(updated);
            setCategories((current) =>
                current.map((item) => (item.id === slug ? category : item)),
            );
            return category;
        },
        [],
    );

    const deleteCategory = useCallback(async (slug: string) => {
        await categoriesApi.deleteCategory(slug);
        setCategories((current) => current.filter((item) => item.id !== slug));
    }, []);

    const resetCategories = useCallback(async () => {
        const rows = await categoriesApi.resetCategories();
        const next = mapCategories(rows);
        setCategories(next);
        return next;
    }, []);

    const value = useMemo<TimeJournalContextValue>(
        () => ({
            authSession,
            categories,
            activities,
            reflections,
            ongoing,
            summary,
            loading,
            error,
            login,
            logout,
            register,
            refreshAll,
            refreshData,
            saveActivity,
            updateActivity,
            deleteActivity,
            upsertReflection,
            deleteReflection,
            addCategory,
            updateCategory,
            deleteCategory,
            resetCategories,
            clearError,
        }),
        [
            authSession,
            categories,
            activities,
            reflections,
            ongoing,
            summary,
            loading,
            error,
            login,
            logout,
            register,
            refreshAll,
            refreshData,
            saveActivity,
            updateActivity,
            deleteActivity,
            upsertReflection,
            deleteReflection,
            addCategory,
            updateCategory,
            deleteCategory,
            resetCategories,
            clearError,
        ],
    );

    return (
        <TimeJournalContext.Provider value={value}>{children}</TimeJournalContext.Provider>
    );
}

export function useTimeJournal(): TimeJournalContextValue {
    const context = useContext(TimeJournalContext);
    if (!context) {
        throw new Error('useTimeJournal must be used within TimeJournalProvider');
    }
    return context;
}
