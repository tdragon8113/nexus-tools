import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDemoStatsViewData } from '../domain/statsDemoData';
import { filterActivitiesForStats, type StatsRangeSelection } from '../domain/stats';
import { useAnalytics } from '../hooks/useAnalytics';
import { usePageRefresh } from '../hooks/PageRefreshProvider';
import { useTimeJournal } from '../hooks/TimeJournalProvider';
import StatsUnifiedView from './stats/statsUnifiedView';

export default function StatsPage() {
    const navigate = useNavigate();
    const { authSession, categories, activities, refreshData } = useTimeJournal();
    const { registerPageRefresh } = usePageRefresh();
    const [rangeSelection, setRangeSelection] = useState<StatsRangeSelection>({
        preset: 'week',
    });
    const [excludeSleep, setExcludeSleep] = useState(false);
    const demoData = useMemo(() => getDemoStatsViewData(), []);

    const { loading, error, data, refetch } = useAnalytics({
        rangeSelection,
        excludeSleep,
        enabled: Boolean(authSession),
    });

    useEffect(() => {
        if (!authSession) {
            return;
        }
        return registerPageRefresh(async () => {
            await refreshData(['activities', 'ongoing']);
            await refetch();
        });
    }, [authSession, registerPageRefresh, refreshData, refetch]);

    const filteredActivities = useMemo(
        () => filterActivitiesForStats(activities, excludeSleep),
        [activities, excludeSleep],
    );

    if (!authSession) {
        return (
            <div className="tj-stats-root tj-stats-root-guest">
                <div className="tj-stats-demo-banner">
                    <div>
                        <strong>示例预览</strong>
                        <span>登录后查看你的真实时间统计</span>
                    </div>
                    <button
                        type="button"
                        className="tj-primary-btn"
                        onClick={() => navigate('/profile')}
                    >
                        去登录
                    </button>
                </div>
                <StatsUnifiedView
                    demoMode
                    activities={demoData.activities}
                    categories={demoData.categories}
                    rangeSelection={rangeSelection}
                    setRangeSelection={setRangeSelection}
                    excludeSleep={excludeSleep}
                    setExcludeSleep={setExcludeSleep}
                    bounds={demoData.bounds}
                    metrics={demoData.metrics}
                    categoryBreakdown={demoData.categoryBreakdown}
                    totalChange={demoData.totalChange}
                    onOpenActivity={() => navigate('/profile')}
                />
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
