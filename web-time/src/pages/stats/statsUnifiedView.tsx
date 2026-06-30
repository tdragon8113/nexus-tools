import { useEffect, useMemo, useState } from 'react';
import DailyOverviewList from '../../components/DailyOverviewList';
import {
    formatDuration,
    getCategoryMeta,
    getCategoryTimelineColor,
    getPeriodDailyTracks,
    getPeriodTimeOfDayBreakdown,
} from '../../domain/stats';
import { isActivityOngoing } from '../../domain/record';
import StatsRangeToolbar from './statsRangeToolbar';
import { ChangeBadge, ExcludeSleepToggle, type StatsViewProps } from './statsShared';

type StatsUnifiedViewProps = StatsViewProps & {
    onOpenActivity?: (activityId: string) => void;
};

export default function StatsUnifiedView({
    activities,
    categories,
    rangeSelection,
    setRangeSelection,
    excludeSleep,
    setExcludeSleep,
    bounds,
    metrics,
    categoryBreakdown,
    totalChange,
    onOpenActivity,
}: StatsUnifiedViewProps) {
    const [focusedCategoryId, setFocusedCategoryId] = useState<string | null>(null);
    const hasOngoing = useMemo(
        () => activities.some(isActivityOngoing),
        [activities],
    );
    const [nowTick, setNowTick] = useState(() => Date.now());

    useEffect(() => {
        setFocusedCategoryId(null);
    }, [rangeSelection, excludeSleep]);

    useEffect(() => {
        if (!hasOngoing) {
            return;
        }
        const timer = window.setInterval(() => setNowTick(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, [hasOngoing]);

    const timeOfDayBreakdown = useMemo(
        () =>
            getPeriodTimeOfDayBreakdown(
                activities,
                categories,
                bounds.startKey,
                bounds.endKey,
                nowTick,
            ),
        [activities, categories, bounds, nowTick],
    );

    const dailyTracks = useMemo(
        () =>
            getPeriodDailyTracks(
                activities,
                categories,
                bounds.startKey,
                bounds.endKey,
                nowTick,
            ),
        [activities, categories, bounds, nowTick],
    );

    const totalMinutes = Math.max(metrics.totalMinutes, 1);
    const visibleCategories = categoryBreakdown.filter((item) => item.minutes > 0);

    const handleFocusCategory = (categoryId: string) => {
        setFocusedCategoryId((current) => (current === categoryId ? null : categoryId));
    };

    return (
        <div className="tj-page tj-stats-unified">
            <header className="tj-page-header">
                <p className="tj-kicker">时间结构</p>
                <h1>统计</h1>
                <p className="tj-page-lead">看这段时间各时段怎么过、每天做了什么。</p>
            </header>

            <StatsRangeToolbar
                rangeSelection={rangeSelection}
                bounds={bounds}
                onChange={setRangeSelection}
            />

            <section className="tj-card tj-stats-summary-card">
                <div className="tj-stats-summary-main">
                    <span>{bounds.label}总时长</span>
                    <strong>{formatDuration(metrics.totalMinutes)}</strong>
                </div>
                <div className="tj-stats-summary-meta">
                    <span>{metrics.activityCount} 条活动</span>
                    <ChangeBadge change={totalChange} previousLabel={bounds.previousLabel} />
                </div>
            </section>

            <section className="tj-section">
                <div className="tj-section-head">
                    <h2>时段汇总</h2>
                    <span>
                        {bounds.dayCount === 1
                            ? '按开始时间归入四段'
                            : `汇总 ${bounds.label} 各时段记录`}
                    </span>
                </div>
                <article className="tj-card tj-stats-segment-hero">
                    {timeOfDayBreakdown.map((segment) => {
                        const percent = Math.round((segment.minutes / totalMinutes) * 100);
                        const barWidth = Math.max(segment.minutes > 0 ? 8 : 0, percent);
                        return (
                            <div key={segment.segment} className="tj-stats-segment-row">
                                <div className="tj-stats-segment-copy">
                                    <strong>{segment.label}</strong>
                                    <span>{segment.hint}</span>
                                </div>
                                <div className="tj-stats-segment-bar-wrap">
                                    <div
                                        className="tj-stats-segment-bar"
                                        style={{ width: `${barWidth}%` }}
                                    >
                                        {segment.categories.map((item) => (
                                            <span
                                                key={item.category}
                                                style={{
                                                    flexGrow: item.minutes,
                                                    background: getCategoryTimelineColor(
                                                        item.category,
                                                    ),
                                                    opacity:
                                                        focusedCategoryId &&
                                                        focusedCategoryId !== item.category
                                                            ? 0.28
                                                            : 1,
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="tj-stats-segment-meta">
                                    <strong>
                                        {segment.minutes > 0
                                            ? formatDuration(segment.minutes)
                                            : '—'}
                                    </strong>
                                    <span>{segment.minutes > 0 ? `${percent}%` : '0%'}</span>
                                </div>
                            </div>
                        );
                    })}
                </article>
            </section>

            <section className="tj-section">
                <div className="tj-section-head">
                    <h2>类型分布</h2>
                    <ExcludeSleepToggle excludeSleep={excludeSleep} onChange={setExcludeSleep} />
                </div>
                {visibleCategories.length === 0 ? (
                    <div className="tj-empty-card">{bounds.label}还没有可统计的数据。</div>
                ) : (
                    <div className="tj-activity-overview-legend tj-stats-category-chips">
                        {visibleCategories.map((item) => {
                            const meta = getCategoryMeta(categories, item.category);
                            const percent = Math.round((item.minutes / totalMinutes) * 100);
                            const active = focusedCategoryId === item.category;
                            return (
                                <button
                                    key={item.category}
                                    type="button"
                                    className={`tj-activity-overview-chip${active ? ' tj-activity-overview-chip-is-active' : ''}`}
                                    aria-pressed={active}
                                    onClick={() => handleFocusCategory(item.category)}
                                >
                                    <span
                                        className="tj-activity-overview-chip-dot"
                                        style={{
                                            background: getCategoryTimelineColor(item.category),
                                        }}
                                    />
                                    {meta.emoji} {meta.label} {formatDuration(item.minutes)} · {percent}
                                    %
                                </button>
                            );
                        })}
                    </div>
                )}
            </section>

            <section className="tj-section">
                <div className="tj-section-head">
                    <h2>每日概览</h2>
                    <span>点某天展开时间轴</span>
                </div>
                <DailyOverviewList
                    dailyTracks={dailyTracks}
                    categories={categories}
                    focusedCategoryId={focusedCategoryId}
                    onOpenActivity={onOpenActivity}
                    emptyText={`${bounds.label}还没有可统计的数据。`}
                />
            </section>
        </div>
    );
}
