import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell,
    ChevronRight,
    HelpCircle,
    Layers,
    Shield,
    Sparkles,
    UserRound,
} from 'lucide-react';
import { getAccountAvatarLetter } from '../../api/mappers';
import RichNoteContent from '../../components/RichNoteContent';
import { getRecordDayCount, getStreakDays, getTotalXp } from '../../domain/dates';
import { getLevelInfo } from '../../domain/level';
import {
    filterReflectionsByScope,
    formatReflectionPeriodLabel,
    getReflectionScope,
    getReflectionScopeLabel,
    getReflectionsSortedDesc,
} from '../../domain/reflections';
import type { AuthSession, Reflection } from '../../domain/types';
import { useTimeJournal } from '../../hooks/TimeJournalProvider';
import AccountAuthSection from './AccountAuthSection';

const menuItems = [
    { icon: Bell, label: '提醒设置', hint: '即将上线' },
    { icon: Shield, label: '数据与隐私', hint: '云端同步' },
    { icon: HelpCircle, label: '使用帮助', hint: '查看说明', action: 'help' as const },
];

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
}: {
    authSession: AuthSession | null;
    streak: number;
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
            <p>已连续记录 {streak} 天</p>
        </>
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

function SummaryScopeNav() {
    const navigate = useNavigate();

    return (
        <div className="tj-summary-scope-nav">
            <button
                type="button"
                className="tj-summary-scope-btn"
                onClick={() => navigate('/profile/reflections')}
            >
                日感悟
            </button>
            <button
                type="button"
                className="tj-summary-scope-btn"
                onClick={() => navigate('/profile/month-summaries')}
            >
                月总结
            </button>
            <button
                type="button"
                className="tj-summary-scope-btn"
                onClick={() => navigate('/profile/year-summaries')}
            >
                年总结
            </button>
        </div>
    );
}

function SettingsList({
    categoryCount,
    authSession,
}: {
    categoryCount: number;
    authSession: AuthSession | null;
}) {
    const navigate = useNavigate();

    return (
        <div className="tj-menu-list">
            {authSession ? (
                <button
                    type="button"
                    className="tj-menu-item"
                    onClick={() => navigate('/profile/account')}
                >
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
            <button
                type="button"
                className="tj-menu-item"
                onClick={() => navigate('/profile/categories')}
            >
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
                    onClick={
                        'action' in item && item.action === 'help'
                            ? () => navigate('/profile/help')
                            : undefined
                    }
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

export default function ProfilePage() {
    const navigate = useNavigate();
    const {
        authSession,
        activities,
        categories,
        reflections,
        summary,
        loading,
    } = useTimeJournal();

    const totalXp = summary?.totalXp ?? getTotalXp(activities);
    const levelInfo = getLevelInfo(totalXp);
    const streak = summary?.streak ?? getStreakDays(activities, categories);
    const recordDays = summary?.recordDays ?? getRecordDayCount(activities, categories);
    const dayReflectionCount = useMemo(
        () => filterReflectionsByScope(reflections, 'day').length,
        [reflections],
    );

    if (loading) {
        return (
            <div className="tj-page tj-profile-root">
                <div className="tj-empty-card">加载中…</div>
            </div>
        );
    }

    return (
        <div className="tj-profile-root">
            <div className="tj-page">
                <header className="tj-profile-hero">
                    <ProfileAvatar authSession={authSession} />
                    <div>
                        <ProfileIdentityCopy authSession={authSession} streak={streak} />
                    </div>
                </header>

                {!authSession ? (
                    <div className="tj-profile-guest-login">
                        <AccountAuthSection />
                    </div>
                ) : null}

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
                                <div
                                    className="tj-progress-fill"
                                    style={{ width: `${levelInfo.progress}%` }}
                                />
                            </div>
                            <p>
                                {totalXp} XP · 距下一级还差{' '}
                                {levelInfo.nextLevelXp - levelInfo.currentXp} XP
                            </p>
                        </section>

                        <section className="tj-profile-metrics">
                            <button
                                type="button"
                                className="tj-card tj-profile-metric-btn"
                                onClick={() => navigate('/profile/record-days')}
                            >
                                <strong>{recordDays}</strong>
                                <span>累计记录天</span>
                            </button>
                            <button
                                type="button"
                                className="tj-card tj-profile-metric-btn"
                                onClick={() => navigate('/profile/activities')}
                            >
                                <strong>{activities.length}</strong>
                                <span>活动条目</span>
                            </button>
                            <button
                                type="button"
                                className="tj-card tj-profile-metric-btn"
                                onClick={() => navigate('/profile/reflections')}
                            >
                                <strong>{dayReflectionCount}</strong>
                                <span>感悟总结</span>
                            </button>
                        </section>

                        <section className="tj-section">
                            <div className="tj-section-head">
                                <h2>感悟与总结</h2>
                                <SummaryScopeNav />
                            </div>
                            <ReflectionList reflections={reflections} />
                        </section>
                    </>
                ) : null}

                <section className="tj-section">
                    <div className="tj-section-head">
                        <h2>设置</h2>
                    </div>
                    <SettingsList categoryCount={categories.length} authSession={authSession} />
                </section>
            </div>
        </div>
    );
}
