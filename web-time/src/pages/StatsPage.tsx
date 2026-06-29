import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { filterActivitiesForStats, type StatsRangeSelection } from '../domain/stats';
import { useAnalytics } from '../hooks/useAnalytics';
import { useTimeJournal } from '../hooks/TimeJournalProvider';
import StatsUnifiedView from './stats/statsUnifiedView';

export default function StatsPage() {
    const navigate = useNavigate();
    const { authSession, categories, activities } = useTimeJournal();
    const [rangeSelection, setRangeSelection] = useState<StatsRangeSelection>({
        preset: 'week',
    });
    const [excludeSleep, setExcludeSleep] = useState(false);

    const { loading, error, data, refetch } = useAnalytics({
        rangeSelection,
        excludeSleep,
        enabled: Boolean(authSession),
    });

    const filteredActivities = useMemo(
        () => filterActivitiesForStats(activities, excludeSleep),
        [activities, excludeSleep],
    );

    if (!authSession) {
        return (
            <div className="tj-page tj-stats-root">
                <header className="tj-page-header">
                    <p className="tj-kicker">时间结构</p>
                    <h1>统计</h1>
                </header>
                <div className="tj-empty-card">
                    <span>登录账户，查看时间统计</span>
                    <button
                        type="button"
                        className="tj-primary-btn"
                        onClick={() => navigate('/profile')}
                    >
                        去登录
                    </button>
                </div>
            </div>
        );
    }

    if (loading && !data) {
        return (
            <div className="tj-page tj-stats-root">
                <div className="tj-empty-card">加载中…</div>
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="tj-page tj-stats-root">
                <div className="tj-empty-card">
                    <span>{error}</span>
                    <button type="button" className="tj-primary-btn" onClick={() => void refetch()}>
                        重试
                    </button>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="tj-page tj-stats-root">
                <div className="tj-empty-card">暂无统计数据</div>
            </div>
        );
    }

    return (
        <div className="tj-stats-root">
            <StatsUnifiedView
                activities={filteredActivities}
                categories={categories}
                rangeSelection={rangeSelection}
                setRangeSelection={setRangeSelection}
                excludeSleep={excludeSleep}
                setExcludeSleep={setExcludeSleep}
                bounds={data.bounds}
                metrics={data.metrics}
                categoryBreakdown={data.categoryBreakdown}
                totalChange={data.totalChange}
                onOpenActivity={(activityId) => navigate(`/activity/${activityId}`)}
            />
        </div>
    );
}
