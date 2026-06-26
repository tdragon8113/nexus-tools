/**
 * @name 时光记
 */

import React, { useMemo, useRef, useState } from 'react';
import { BarChart3, Home, PlusCircle, User } from 'lucide-react';
import { defineHashPageRoute, useHashPage } from '../../common/useHashPage';
import { AuthSession, demoAuthSession, isDemoAccount } from './auth';
import {
    Activity,
    ActivityCategoryConfig,
    Reflection,
    ReflectionScope,
    ActiveRecordingSession,
    countActivitiesByCategory,
    formatDateKey,
    getReflectionScope,
    initialActivities,
    initialCategories,
    initialReflections,
} from './data';
import HomePage from './pages/HomePage';
import ActivityDetailPage from './pages/ActivityDetailPage';
import CategoryManagePage from './pages/profile/CategoryManagePage';
import HelpPage from './pages/profile/HelpPage';
import AccountManagePage from './pages/profile/AccountManagePage';
import ChangePasswordPage from './pages/profile/ChangePasswordPage';
import ProfilePage from './pages/profile/ProfilePage';
import ProfileArchivePage from './pages/profile/ProfileArchivePage';
import RecordPage from './pages/RecordPage';
import StatsPage from './pages/StatsPage';
import { hasNoteContent, sanitizeNoteHtml } from './noteRichText';
import './style.css';

const route = defineHashPageRoute(
    [
        { id: 'home', title: '首页' },
        { id: 'record', title: '记录' },
        { id: 'stats', title: '统计' },
        { id: 'profile', title: '我的' },
        { id: 'profile-categories', title: '活动类型管理' },
        { id: 'profile-help', title: '使用帮助' },
        { id: 'profile-account-manage', title: '账户管理' },
        { id: 'profile-change-password', title: '修改密码' },
        { id: 'profile-record-days', title: '记录天' },
        { id: 'profile-activities', title: '全部活动' },
        { id: 'profile-reflections', title: '全部感悟' },
        { id: 'profile-month-summaries', title: '月总结' },
        { id: 'profile-year-summaries', title: '年总结' },
        { id: 'activity-detail', title: '活动详情' },
    ],
    { defaultPageId: 'home' },
);

const tabs = [
    { id: 'home', label: '首页', icon: Home },
    { id: 'record', label: '记录', icon: PlusCircle },
    { id: 'stats', label: '统计', icon: BarChart3 },
    { id: 'profile', label: '我的', icon: User },
] as const;

type UserDataSnapshot = {
    activities: Activity[];
    reflections: Reflection[];
    categories: ActivityCategoryConfig[];
    activeRecording: ActiveRecordingSession | null;
};

function cloneCategories(): ActivityCategoryConfig[] {
    return initialCategories.map((item) => ({ ...item }));
}

function createDemoUserData(): UserDataSnapshot {
    return {
        activities: initialActivities,
        reflections: initialReflections,
        categories: cloneCategories(),
        activeRecording: null,
    };
}

function createEmptyUserData(): UserDataSnapshot {
    return {
        activities: [],
        reflections: [],
        categories: cloneCategories(),
        activeRecording: null,
    };
}

export default function TimeJournalApp() {
    const { page, setPage } = useHashPage(route);
    const [activities, setActivities] = useState<Activity[]>(initialActivities);
    const [reflections, setReflections] = useState<Reflection[]>(initialReflections);
    const [categories, setCategories] = useState<ActivityCategoryConfig[]>(initialCategories);
    const [activeRecording, setActiveRecording] = useState<ActiveRecordingSession | null>(null);
    const [authSession, setAuthSession] = useState<AuthSession | null>(demoAuthSession);
    const [userDataCache, setUserDataCache] = useState<Record<string, UserDataSnapshot>>({});
    const userDataCacheRef = useRef(userDataCache);
    userDataCacheRef.current = userDataCache;
    const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
    const isRecording = activeRecording !== null;

    const selectedActivity = useMemo(
        () =>
            selectedActivityId
                ? activities.find((item) => item.id === selectedActivityId) ?? null
                : null,
        [activities, selectedActivityId],
    );

    const handleOpenActivity = (activityId: string) => {
        setSelectedActivityId(activityId);
        setPage('activity-detail');
    };

    const handleCloseActivity = () => {
        setSelectedActivityId(null);
        setPage('home');
    };

    const handleSaveActivity = (activity: Activity) => {
        setActivities((current) => [activity, ...current]);
    };

    const handleUpdateActivityNote = (activityId: string, note: string) => {
        const nextNote = note && hasNoteContent(note) ? sanitizeNoteHtml(note) : undefined;
        setActivities((current) =>
            current.map((item) =>
                item.id === activityId ? { ...item, note: nextNote } : item,
            ),
        );
    };

    const handleUpsertReflection = (scope: ReflectionScope, period: string, content: string) => {
        const nextContent = sanitizeNoteHtml(content);
        if (!hasNoteContent(nextContent)) {
            return;
        }
        setReflections((current) => {
            const existing = current.find(
                (item) => getReflectionScope(item) === scope && item.date === period,
            );
            if (existing) {
                return current.map((item) =>
                    item.id === existing.id ? { ...item, content: nextContent } : item,
                );
            }
            return [
                { id: `r-${Date.now()}`, scope, date: period, content: nextContent },
                ...current,
            ];
        });
    };

    const handleAddReflection = (content: string) => {
        handleUpsertReflection('day', formatDateKey(new Date()), content);
    };

    const handleAddCategory = (category: ActivityCategoryConfig) => {
        setCategories((current) => [...current, category]);
    };

    const handleUpdateCategory = (
        id: string,
        patch: Partial<Omit<ActivityCategoryConfig, 'id'>>,
    ) => {
        setCategories((current) =>
            current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        );
    };

    const handleDeleteCategory = (id: string): string | null => {
        if (categories.length <= 1) {
            return '至少保留一个活动类型';
        }
        if (countActivitiesByCategory(activities, id) > 0) {
            return '该类型已有记录，无法删除';
        }
        setCategories((current) => current.filter((item) => item.id !== id));
        return null;
    };

    const persistCurrentUserData = (session: AuthSession | null) => {
        if (!session) {
            return;
        }
        setUserDataCache((current) => ({
            ...current,
            [session.user.id]: {
                activities,
                reflections,
                categories,
                activeRecording,
            },
        }));
    };

    const loadUserData = (session: AuthSession) => {
        const cached = userDataCacheRef.current[session.user.id];
        if (cached) {
            setActivities(cached.activities);
            setReflections(cached.reflections);
            setCategories(cached.categories);
            setActiveRecording(cached.activeRecording);
            return;
        }

        const nextData = isDemoAccount(session) ? createDemoUserData() : createEmptyUserData();
        setActivities(nextData.activities);
        setReflections(nextData.reflections);
        setCategories(nextData.categories);
        setActiveRecording(nextData.activeRecording);
    };

    const handleLogin = (session: AuthSession) => {
        if (authSession && authSession.user.id !== session.user.id) {
            persistCurrentUserData(authSession);
        }
        loadUserData(session);
        setAuthSession(session);
        setSelectedActivityId(null);
    };

    const handleLogout = () => {
        persistCurrentUserData(authSession);
        setAuthSession(null);
        setSelectedActivityId(null);
        if (page === 'activity-detail') {
            setPage('profile');
        }
    };

    return (
        <div className="tj-shell">
            <div className="tj-phone">
                <main className="tj-main">
                    <div className={page === 'home' ? undefined : 'tj-home-page-host'} aria-hidden={page !== 'home'}>
                        <HomePage
                            activities={activities}
                            categories={categories}
                            reflections={reflections}
                            activeRecording={activeRecording}
                            authSession={authSession}
                            onQuickRecord={() => setPage('record')}
                            onOpenRecording={() => setPage('record')}
                            onAddReflection={handleAddReflection}
                            onOpenActivity={handleOpenActivity}
                            onOpenLogin={() => setPage('profile')}
                        />
                    </div>
                    {page === 'activity-detail' ? (
                        <ActivityDetailPage
                            activity={selectedActivity}
                            categories={categories}
                            onBack={handleCloseActivity}
                            onUpdateNote={handleUpdateActivityNote}
                        />
                    ) : null}
                    <div className={page === 'record' ? undefined : 'tj-record-page-host'} aria-hidden={page !== 'record'}>
                        <RecordPage
                            key={authSession?.user.id ?? 'guest'}
                            categories={categories}
                            initialActiveRecording={activeRecording}
                            onSave={handleSaveActivity}
                            onActiveSessionChange={setActiveRecording}
                        />
                    </div>
                    {page === 'stats' ? (
                        <StatsPage
                            activities={activities}
                            categories={categories}
                            onOpenActivity={handleOpenActivity}
                        />
                    ) : null}
                    {page === 'profile' ? (
                        <ProfilePage
                            authSession={authSession}
                            activities={activities}
                            categories={categories}
                            reflections={reflections}
                            onLogin={handleLogin}
                            onLogout={handleLogout}
                            onOpenCategoryManage={() => setPage('profile-categories')}
                            onOpenHelp={() => setPage('profile-help')}
                            onOpenRecordDays={() => setPage('profile-record-days')}
                            onOpenActivitiesList={() => setPage('profile-activities')}
                            onOpenReflectionsList={() => setPage('profile-reflections')}
                            onOpenMonthSummaries={() => setPage('profile-month-summaries')}
                            onOpenYearSummaries={() => setPage('profile-year-summaries')}
                            onOpenAccountManage={() => setPage('profile-account-manage')}
                        />
                    ) : null}
                    {page === 'profile-categories' ? (
                        <CategoryManagePage
                            categories={categories}
                            activities={activities}
                            onBack={() => setPage('profile')}
                            onAdd={handleAddCategory}
                            onUpdate={handleUpdateCategory}
                            onDelete={handleDeleteCategory}
                        />
                    ) : null}
                    {page === 'profile-help' ? (
                        <HelpPage onBack={() => setPage('profile')} />
                    ) : null}
                    {page === 'profile-account-manage' && authSession ? (
                        <AccountManagePage
                            authSession={authSession}
                            onBack={() => setPage('profile')}
                            onOpenChangePassword={() => setPage('profile-change-password')}
                            onLogout={handleLogout}
                        />
                    ) : null}
                    {page === 'profile-change-password' && authSession ? (
                        <ChangePasswordPage
                            authSession={authSession}
                            onBack={() => setPage('profile-account-manage')}
                        />
                    ) : null}
                    {page === 'profile-record-days' ? (
                        <ProfileArchivePage
                            kind="record-days"
                            activities={activities}
                            categories={categories}
                            reflections={reflections}
                            onBack={() => setPage('profile')}
                            onOpenActivity={handleOpenActivity}
                        />
                    ) : null}
                    {page === 'profile-activities' ? (
                        <ProfileArchivePage
                            kind="activities"
                            activities={activities}
                            categories={categories}
                            reflections={reflections}
                            onBack={() => setPage('profile')}
                            onOpenActivity={handleOpenActivity}
                        />
                    ) : null}
                    {page === 'profile-reflections' ? (
                        <ProfileArchivePage
                            kind="reflections"
                            activities={activities}
                            categories={categories}
                            reflections={reflections}
                            onBack={() => setPage('profile')}
                            onOpenActivity={handleOpenActivity}
                            onUpsertReflection={handleUpsertReflection}
                        />
                    ) : null}
                    {page === 'profile-month-summaries' ? (
                        <ProfileArchivePage
                            kind="month-summaries"
                            activities={activities}
                            categories={categories}
                            reflections={reflections}
                            onBack={() => setPage('profile')}
                            onOpenActivity={handleOpenActivity}
                            onUpsertReflection={handleUpsertReflection}
                        />
                    ) : null}
                    {page === 'profile-year-summaries' ? (
                        <ProfileArchivePage
                            kind="year-summaries"
                            activities={activities}
                            categories={categories}
                            reflections={reflections}
                            onBack={() => setPage('profile')}
                            onOpenActivity={handleOpenActivity}
                            onUpsertReflection={handleUpsertReflection}
                        />
                    ) : null}
                </main>

                <nav className="tj-tabbar" aria-label="主导航">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const active =
                            page === tab.id
                            || (tab.id === 'profile'
                                && (page === 'profile-categories'
                                    || page === 'profile-help'
                                    || page === 'profile-account-manage'
                                    || page === 'profile-change-password'
                                    || page === 'profile-record-days'
                                    || page === 'profile-activities'
                                    || page === 'profile-reflections'
                                    || page === 'profile-month-summaries'
                                    || page === 'profile-year-summaries'))
                            || (tab.id === 'home' && page === 'activity-detail');
                        const showRecordingHint = tab.id === 'record' && isRecording;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                className={`tj-tab ${active ? 'tj-tab-active' : ''}${showRecordingHint ? ' tj-tab-recording' : ''}`}
                                onClick={() => setPage(tab.id)}
                                aria-current={active ? 'page' : undefined}
                                aria-label={showRecordingHint ? '记录中' : tab.label}
                            >
                                <span className="tj-tab-icon-wrap">
                                    <Icon size={20} strokeWidth={active ? 2.4 : 2} />
                                    {showRecordingHint ? (
                                        <span className="tj-tab-recording-dot" aria-hidden="true" />
                                    ) : null}
                                </span>
                                <span>{showRecordingHint ? '记录中' : tab.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
