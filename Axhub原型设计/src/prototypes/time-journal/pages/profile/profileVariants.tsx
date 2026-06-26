import React from 'react';
import RichNoteContent from '../../components/RichNoteContent';
import { Bell, ChevronRight, Flame, HelpCircle, Layers, Shield, Sparkles, Trophy, UserRound } from 'lucide-react';
import { AuthSession, getAccountAvatarLetter } from '../../auth';
import {
    Activity,
    ActivityCategoryConfig,
    Reflection,
    filterReflectionsByScope,
    formatReflectionPeriodLabel,
    getCategoryMeta,
    getLevelInfo,
    getReflectionScope,
    getReflectionScopeLabel,
    getReflectionsSortedDesc,
    getWeekCategoryStats,
} from '../../data';
import AccountAuthSection from './AccountAuthSection';

export type ProfileViewProps = {
    authSession: AuthSession | null;
    activities: Activity[];
    categories: ActivityCategoryConfig[];
    reflections: Reflection[];
    totalXp: number;
    levelInfo: ReturnType<typeof getLevelInfo>;
    streak: number;
    recordDays: number;
    onLogin: (session: AuthSession) => void;
    onOpenCategoryManage: () => void;
    onOpenHelp: () => void;
    onOpenRecordDays: () => void;
    onOpenActivitiesList: () => void;
    onOpenReflectionsList: () => void;
    onOpenMonthSummaries: () => void;
    onOpenYearSummaries: () => void;
    onOpenAccountManage: () => void;
};

function ProfileGuestLogin({ onLogin }: { onLogin: (session: AuthSession) => void }) {
    return (
        <div className="tj-profile-guest-login">
            <AccountAuthSection onLogin={onLogin} />
        </div>
    );
}

function ProfileAvatar({ authSession }: { authSession: AuthSession | null }) {
    if (!authSession) {
        return <div className="tj-avatar tj-avatar-guest">?</div>;
    }
    return (
        <div className="tj-avatar" style={{ background: authSession.user.avatarColor }}>
            {getAccountAvatarLetter(authSession.user.displayName)}
        </div>
    );
}

function ProfileIdentityCopy({
    authSession,
    streak,
    topCategory,
}: {
    authSession: AuthSession | null;
    streak: number;
    topCategory?: string;
}) {
    if (!authSession) {
        return (
            <>
                <h1>登录时光记</h1>
                <p>登录后可在手机、平板继续使用你的记录</p>
            </>
        );
    }

    return (
        <>
            <h1>{authSession.user.account}</h1>
            {topCategory ? (
                <p>已连续记录 {streak} 天 · 最近常做 {topCategory}</p>
            ) : (
                <p>已连续记录 {streak} 天</p>
            )}
        </>
    );
}

const menuItems = [
    { icon: Bell, label: '提醒设置', hint: '即将上线' },
    { icon: Shield, label: '数据与隐私', hint: '云端同步' },
    { icon: HelpCircle, label: '使用帮助', hint: '查看说明', action: 'help' as const },
];

const achievements = [
    { title: '连续 3 天', emoji: '🔥' },
    { title: '首次感悟', emoji: '✍️' },
    { title: '运动达人', emoji: '🏃' },
    { title: '学习 5 次', emoji: '📚' },
];

function ProfileStatChips({
    recordDays,
    activityCount,
    reflectionCount,
    onOpenRecordDays,
    onOpenActivitiesList,
    onOpenReflectionsList,
}: {
    recordDays: number;
    activityCount: number;
    reflectionCount: number;
    onOpenRecordDays: () => void;
    onOpenActivitiesList: () => void;
    onOpenReflectionsList: () => void;
}) {
    return (
        <div className="tj-profile-chip-row">
            <button type="button" className="tj-profile-chip" onClick={onOpenRecordDays}>
                {recordDays} 天记录
            </button>
            <button type="button" className="tj-profile-chip" onClick={onOpenActivitiesList}>
                {activityCount} 条活动
            </button>
            <button type="button" className="tj-profile-chip" onClick={onOpenReflectionsList}>
                {reflectionCount} 条感悟
            </button>
        </div>
    );
}

function SummaryScopeNav({
    onOpenReflectionsList,
    onOpenMonthSummaries,
    onOpenYearSummaries,
}: Pick<
    ProfileViewProps,
    'onOpenReflectionsList' | 'onOpenMonthSummaries' | 'onOpenYearSummaries'
>) {
    return (
        <div className="tj-summary-scope-nav">
            <button type="button" className="tj-summary-scope-btn" onClick={onOpenReflectionsList}>
                日感悟
            </button>
            <button type="button" className="tj-summary-scope-btn" onClick={onOpenMonthSummaries}>
                月总结
            </button>
            <button type="button" className="tj-summary-scope-btn" onClick={onOpenYearSummaries}>
                年总结
            </button>
        </div>
    );
}

function ReflectionList({ reflections }: { reflections: Reflection[] }) {
    const items = getReflectionsSortedDesc(reflections).slice(0, 3);

    return (
        <div className="tj-reflection-list">
            {items.map((item) => (
                <article key={item.id} className="tj-card tj-reflection-card">
                    <div className="tj-reflection-card-head">
                        <span className="tj-reflection-scope-badge">
                            {getReflectionScopeLabel(getReflectionScope(item))}
                        </span>
                        <span>{formatReflectionPeriodLabel(item)}</span>
                    </div>
                    <RichNoteContent html={item.content} />
                </article>
            ))}
        </div>
    );
}

function SettingsList({
    categoryCount,
    authSession,
    onOpenCategoryManage,
    onOpenHelp,
    onOpenAccountManage,
}: {
    categoryCount: number;
    authSession: AuthSession | null;
    onOpenCategoryManage: () => void;
    onOpenHelp: () => void;
    onOpenAccountManage: () => void;
}) {
    return (
        <div className="tj-menu-list">
            {authSession ? (
                <button type="button" className="tj-menu-item" onClick={onOpenAccountManage}>
                    <div>
                        <UserRound size={18} />
                        <span>账户管理</span>
                    </div>
                    <div className="tj-menu-meta">
                        <em>{authSession.user.account}</em>
                        <ChevronRight size={16} />
                    </div>
                </button>
            ) : null}
            <button type="button" className="tj-menu-item" onClick={onOpenCategoryManage}>
                <div>
                    <Layers size={18} />
                    <span>活动类型管理</span>
                </div>
                <div className="tj-menu-meta">
                    <em>{categoryCount} 个类型</em>
                    <ChevronRight size={16} />
                </div>
            </button>
            {menuItems.map((item) => (
                <button
                    key={item.label}
                    type="button"
                    className="tj-menu-item"
                    onClick={'action' in item && item.action === 'help' ? onOpenHelp : undefined}
                >
                    <div>
                        <item.icon size={18} />
                        <span>{item.label}</span>
                    </div>
                    <div className="tj-menu-meta">
                        <em>{item.hint}</em>
                        <ChevronRight size={16} />
                    </div>
                </button>
            ))}
        </div>
    );
}

export function ProfileSteadyVariant({
    authSession,
    activities,
    categories,
    reflections,
    totalXp,
    levelInfo,
    streak,
    recordDays,
    onLogin,
    onOpenCategoryManage,
    onOpenHelp,
    onOpenRecordDays,
    onOpenActivitiesList,
    onOpenReflectionsList,
    onOpenMonthSummaries,
    onOpenYearSummaries,
    onOpenAccountManage,
}: ProfileViewProps) {
    const dayReflectionCount = filterReflectionsByScope(reflections, 'day').length;

    return (
        <div className="tj-page">
            <header className="tj-profile-hero">
                <ProfileAvatar authSession={authSession} />
                <div>
                    <ProfileIdentityCopy authSession={authSession} streak={streak} />
                </div>
            </header>

            {!authSession ? <ProfileGuestLogin onLogin={onLogin} /> : null}

            {authSession ? (
                <>
                    <section className="tj-card tj-profile-level">
                        <div className="tj-profile-level-top">
                            <div>
                                <span>当前等级</span>
                                <strong>Lv.{levelInfo.level}</strong>
                            </div>
                            <div className="tj-profile-badge">
                                <Sparkles size={16} />
                                生活旅人
                            </div>
                        </div>
                        <div className="tj-progress-track">
                            <div className="tj-progress-fill" style={{ width: `${levelInfo.progress}%` }} />
                        </div>
                        <p>{totalXp} XP · 距下一级还差 {levelInfo.nextLevelXp - levelInfo.currentXp} XP</p>
                    </section>

                    <section className="tj-profile-metrics">
                        <button type="button" className="tj-card tj-profile-metric-btn" onClick={onOpenRecordDays}>
                            <strong>{recordDays}</strong>
                            <span>累计记录天</span>
                        </button>
                        <button type="button" className="tj-card tj-profile-metric-btn" onClick={onOpenActivitiesList}>
                            <strong>{activities.length}</strong>
                            <span>活动条目</span>
                        </button>
                        <button
                            type="button"
                            className="tj-card tj-profile-metric-btn"
                            onClick={onOpenReflectionsList}
                        >
                            <strong>{dayReflectionCount}</strong>
                            <span>感悟总结</span>
                        </button>
                    </section>

                    <section className="tj-section">
                        <div className="tj-section-head">
                            <h2>感悟与总结</h2>
                            <SummaryScopeNav
                                onOpenReflectionsList={onOpenReflectionsList}
                                onOpenMonthSummaries={onOpenMonthSummaries}
                                onOpenYearSummaries={onOpenYearSummaries}
                            />
                        </div>
                        <ReflectionList reflections={reflections} />
                    </section>
                </>
            ) : null}

            <section className="tj-section">
                <div className="tj-section-head">
                    <h2>设置</h2>
                </div>
                <SettingsList
                    categoryCount={categories.length}
                    authSession={authSession}
                    onOpenCategoryManage={onOpenCategoryManage}
                    onOpenHelp={onOpenHelp}
                    onOpenAccountManage={onOpenAccountManage}
                />
            </section>
        </div>
    );
}

export function ProfileBalancedVariant({
    authSession,
    activities,
    categories,
    reflections,
    totalXp,
    levelInfo,
    streak,
    recordDays,
    onLogin,
    onOpenCategoryManage,
    onOpenHelp,
    onOpenRecordDays,
    onOpenActivitiesList,
    onOpenReflectionsList,
    onOpenMonthSummaries,
    onOpenYearSummaries,
    onOpenAccountManage,
}: ProfileViewProps) {
    const categoryStats = getWeekCategoryStats(activities, categories);
    const topCategory = categoryStats[0]
        ? getCategoryMeta(categories, categoryStats[0].category).label
        : '学习';
    const dayReflectionCount = filterReflectionsByScope(reflections, 'day').length;
    const recentSummaries = getReflectionsSortedDesc(reflections).slice(0, 3);

    return (
        <div className="tj-page">
            <section className="tj-card tj-profile-dashboard">
                <div className="tj-profile-dashboard-top">
                    <ProfileAvatar authSession={authSession} />
                    <div className="tj-profile-dashboard-copy">
                        <ProfileIdentityCopy
                            authSession={authSession}
                            streak={streak}
                            topCategory={authSession ? topCategory : undefined}
                        />
                    </div>
                    {authSession ? <div className="tj-level-badge">Lv.{levelInfo.level}</div> : null}
                </div>

                {!authSession ? <ProfileGuestLogin onLogin={onLogin} /> : null}

                {authSession ? (
                    <>
                        <div className="tj-profile-dashboard-level">
                            <div className="tj-profile-level-top">
                                <div>
                                    <span>生活旅人</span>
                                    <strong>{totalXp} XP</strong>
                                </div>
                                <span className="tj-profile-next">
                                    还差 {levelInfo.nextLevelXp - levelInfo.currentXp} XP 升级
                                </span>
                            </div>
                            <div className="tj-progress-track">
                                <div className="tj-progress-fill" style={{ width: `${levelInfo.progress}%` }} />
                            </div>
                        </div>

                        <ProfileStatChips
                            recordDays={recordDays}
                            activityCount={activities.length}
                            reflectionCount={dayReflectionCount}
                            onOpenRecordDays={onOpenRecordDays}
                            onOpenActivitiesList={onOpenActivitiesList}
                            onOpenReflectionsList={onOpenReflectionsList}
                        />
                    </>
                ) : null}
            </section>

            {authSession ? (
                <section className="tj-section">
                    <div className="tj-section-head">
                        <h2>感悟与总结</h2>
                        <SummaryScopeNav
                            onOpenReflectionsList={onOpenReflectionsList}
                            onOpenMonthSummaries={onOpenMonthSummaries}
                            onOpenYearSummaries={onOpenYearSummaries}
                        />
                    </div>
                    <div className="tj-timeline">
                        {recentSummaries.map((item, index) => (
                            <article key={item.id} className="tj-timeline-item">
                                <div className="tj-timeline-dot" />
                                {index < recentSummaries.length - 1 ? (
                                    <div className="tj-timeline-line" />
                                ) : null}
                                <div className="tj-timeline-copy">
                                    <div className="tj-reflection-card-head">
                                        <span className="tj-reflection-scope-badge">
                                            {getReflectionScopeLabel(getReflectionScope(item))}
                                        </span>
                                        <span>{formatReflectionPeriodLabel(item)}</span>
                                    </div>
                                    <RichNoteContent html={item.content} />
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            ) : null}

            <section className="tj-section">
                <div className="tj-section-head">
                    <h2>设置</h2>
                </div>
                <div className="tj-card tj-settings-card">
                    <SettingsList
                        categoryCount={categories.length}
                        authSession={authSession}
                        onOpenCategoryManage={onOpenCategoryManage}
                        onOpenHelp={onOpenHelp}
                        onOpenAccountManage={onOpenAccountManage}
                    />
                </div>
            </section>
        </div>
    );
}

export function ProfileBoldVariant({
    authSession,
    reflections,
    totalXp,
    levelInfo,
    streak,
    recordDays,
    activities,
    categories,
    onLogin,
    onOpenCategoryManage,
    onOpenHelp,
    onOpenRecordDays,
    onOpenActivitiesList,
    onOpenReflectionsList,
    onOpenMonthSummaries,
    onOpenYearSummaries,
    onOpenAccountManage,
}: ProfileViewProps) {
    const ringRadius = 54;
    const ringCircumference = 2 * Math.PI * ringRadius;
    const ringOffset = ringCircumference - (levelInfo.progress / 100) * ringCircumference;
    const dayReflectionCount = filterReflectionsByScope(reflections, 'day').length;

    return (
        <div className="tj-page tj-page-bold">
            <section className="tj-card tj-profile-bold-hero">
                {authSession ? (
                    <div className="tj-profile-ring-wrap">
                        <svg className="tj-profile-ring" viewBox="0 0 128 128" aria-hidden="true">
                            <circle cx="64" cy="64" r={ringRadius} className="tj-profile-ring-bg" />
                            <circle
                                cx="64"
                                cy="64"
                                r={ringRadius}
                                className="tj-profile-ring-fill"
                                strokeDasharray={ringCircumference}
                                strokeDashoffset={ringOffset}
                            />
                        </svg>
                        <div className="tj-profile-ring-center">
                            <strong>Lv.{levelInfo.level}</strong>
                            <span>{totalXp} XP</span>
                        </div>
                    </div>
                ) : (
                    <ProfileAvatar authSession={authSession} />
                )}

                <div className="tj-profile-bold-copy">
                    <ProfileIdentityCopy authSession={authSession} streak={streak} />
                </div>
            </section>

            {!authSession ? <ProfileGuestLogin onLogin={onLogin} /> : null}

            {authSession ? (
                <>
                    <section className="tj-profile-metrics tj-profile-metrics-bold">
                        <button type="button" className="tj-card tj-profile-metric-btn" onClick={onOpenRecordDays}>
                            <Trophy size={18} />
                            <strong>{recordDays}</strong>
                            <span>记录天</span>
                        </button>
                        <button type="button" className="tj-card tj-profile-metric-btn" onClick={onOpenActivitiesList}>
                            <Sparkles size={18} />
                            <strong>{activities.length}</strong>
                            <span>活动</span>
                        </button>
                        <button
                            type="button"
                            className="tj-card tj-profile-metric-btn"
                            onClick={onOpenReflectionsList}
                        >
                            <Flame size={18} />
                            <strong>{dayReflectionCount}</strong>
                            <span>感悟</span>
                        </button>
                    </section>

                    <section className="tj-section">
                        <div className="tj-section-head">
                            <h2>成就徽章</h2>
                        </div>
                        <div className="tj-badge-grid">
                            {achievements.map((item) => (
                                <article key={item.title} className="tj-badge-card">
                                    <span>{item.emoji}</span>
                                    <strong>{item.title}</strong>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section className="tj-section">
                        <div className="tj-section-head">
                            <h2>感悟与总结</h2>
                            <SummaryScopeNav
                                onOpenReflectionsList={onOpenReflectionsList}
                                onOpenMonthSummaries={onOpenMonthSummaries}
                                onOpenYearSummaries={onOpenYearSummaries}
                            />
                        </div>
                        <ReflectionList reflections={reflections} />
                    </section>
                </>
            ) : null}

            <section className="tj-section">
                <div className="tj-section-head">
                    <h2>快捷设置</h2>
                </div>
                <div className="tj-icon-grid">
                    {authSession ? (
                        <button type="button" className="tj-icon-grid-item" onClick={onOpenAccountManage}>
                            <UserRound size={20} />
                            <span>账户管理</span>
                        </button>
                    ) : null}
                    <button type="button" className="tj-icon-grid-item" onClick={onOpenCategoryManage}>
                        <Layers size={20} />
                        <span>活动类型</span>
                    </button>
                    {menuItems.map((item) => (
                        <button
                            key={item.label}
                            type="button"
                            className="tj-icon-grid-item"
                            onClick={'action' in item && item.action === 'help' ? onOpenHelp : undefined}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </div>
            </section>
        </div>
    );
}

export function renderProfileVariant(variant: 'steady' | 'balanced' | 'bold', props: ProfileViewProps) {
    if (variant === 'steady') {
        return <ProfileSteadyVariant {...props} />;
    }
    if (variant === 'bold') {
        return <ProfileBoldVariant {...props} />;
    }
    return <ProfileBalancedVariant {...props} />;
}
