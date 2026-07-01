import { ChevronRight, Sparkles } from 'lucide-react';
import type { Activity, ActivityCategory, ActivityCategoryConfig } from '../../domain/types';
import {
    formatDuration,
    getActivitiesInDateRange,
    getCategoryMeta,
    getCategoryTimelineColor,
    parseBucketDateRange,
    type StatsCategoryBreakdown,
    type StatsChartBucket,
    type StatsDayMarker,
    type StatsPeriodBounds,
    type StatsPeriodMetrics,
    type StatsRangeSelection,
} from '../../domain/stats';

export type StatsViewProps = {
    activities: Activity[];
    categories: ActivityCategoryConfig[];
    rangeSelection: StatsRangeSelection;
    setRangeSelection: (selection: StatsRangeSelection) => void;
    excludeSleep: boolean;
    setExcludeSleep: (value: boolean) => void;
    bounds: StatsPeriodBounds;
    metrics: StatsPeriodMetrics;
    categoryBreakdown: StatsCategoryBreakdown[];
    totalChange: number | null;
};

export function ChangeBadge({
    change,
    previousLabel,
}: {
    change: number | null;
    previousLabel: string;
}) {
    if (change === null) {
        return <span className="tj-stat-change tj-stat-change-neutral">较{previousLabel} —</span>;
    }
    if (change > 0) {
        return (
            <span className="tj-stat-change tj-stat-change-up">
                ↑{change}% <em>vs {previousLabel}</em>
            </span>
        );
    }
    if (change < 0) {
        return (
            <span className="tj-stat-change tj-stat-change-down">
                ↓{Math.abs(change)}% <em>vs {previousLabel}</em>
            </span>
        );
    }
    return <span className="tj-stat-change tj-stat-change-neutral">与{previousLabel}持平</span>;
}

export function CategoryChange({ change }: { change: number | null }) {
    if (change === null) {
        return null;
    }
    if (change > 0) {
        return <span className="tj-category-change tj-category-change-up">↑{change}%</span>;
    }
    if (change < 0) {
        return <span className="tj-category-change tj-category-change-down">↓{Math.abs(change)}%</span>;
    }
    return <span className="tj-category-change">持平</span>;
}

export function ExcludeSleepToggle({
    excludeSleep,
    onChange,
    disabled = false,
}: {
    excludeSleep: boolean;
    onChange: (value: boolean) => void;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            disabled={disabled}
            className={`tj-stats-filter-chip${excludeSleep ? ' tj-stats-filter-chip-active' : ''}`}
            onClick={() => onChange(!excludeSleep)}
        >
            不含睡觉
        </button>
    );
}

type StackedBarChartProps = {
    buckets: StatsChartBucket[];
    categories: ActivityCategoryConfig[];
    maxBucketMinutes: number;
    selectedBucketId?: string | null;
    focusedCategory?: ActivityCategory | null;
    onSelectBucket?: (bucketId: string) => void;
    compact?: boolean;
};

export function StackedBarChart({
    buckets,
    categories,
    maxBucketMinutes,
    selectedBucketId = null,
    focusedCategory = null,
    onSelectBucket,
    compact = false,
}: StackedBarChartProps) {
    return (
        <div
            className={`tj-bar-chart tj-bar-chart-stacked${compact ? ' tj-bar-chart-compact' : ''}`}
            style={{
                gridTemplateColumns: `repeat(${buckets.length}, minmax(0, 1fr))`,
            }}
        >
            {buckets.map((item) => {
                const height = Math.max(
                    item.minutes > 0 ? 10 : 4,
                    (item.minutes / maxBucketMinutes) * 100,
                );
                const selected = selectedBucketId === item.id;

                return (
                    <button
                        key={item.id}
                        type="button"
                        className={`tj-bar-col${onSelectBucket ? ' tj-bar-col-btn' : ''}${selected ? ' tj-bar-col-selected' : ''}`}
                        onClick={() => onSelectBucket?.(item.id)}
                        disabled={!onSelectBucket}
                    >
                        <div className="tj-bar-track">
                            {item.minutes > 0 ? (
                                <div className="tj-bar-stack" style={{ height: `${height}%` }}>
                                    {item.categories.map((segment) => {
                                        const dimmed =
                                            focusedCategory !== null &&
                                            focusedCategory !== segment.category;
                                        return (
                                            <div
                                                key={segment.category}
                                                className={`tj-bar-stack-segment${dimmed ? ' tj-bar-stack-segment-dimmed' : ''}`}
                                                style={{
                                                    flexGrow: segment.minutes,
                                                    background: getCategoryTimelineColor(
                                                        segment.category,
                                                    ),
                                                }}
                                                title={`${getCategoryMeta(categories, segment.category).label} ${formatDuration(segment.minutes)}`}
                                            />
                                        );
                                    })}
                                </div>
                            ) : null}
                        </div>
                        <span>{item.label}</span>
                        <em>{item.minutes > 0 ? formatDuration(item.minutes) : '-'}</em>
                        {!compact ? <small>{item.subLabel}</small> : null}
                    </button>
                );
            })}
        </div>
    );
}

export function BucketDrillPanel({
    bucket,
    activities,
    categories,
}: {
    bucket: StatsChartBucket;
    activities: Activity[];
    categories: ActivityCategoryConfig[];
}) {
    const { startKey, endKey } = parseBucketDateRange(bucket.id);
    const bucketActivities = getActivitiesInDateRange(
        activities,
        categories,
        startKey,
        endKey,
        false,
    );
    const bucketTotal = Math.max(bucket.minutes, 1);

    return (
        <article className="tj-card tj-stats-drill-panel">
            <div className="tj-stats-drill-head">
                <strong>
                    {bucket.label} · {bucket.subLabel}
                </strong>
                <span>{formatDuration(bucket.minutes)}</span>
            </div>
            {bucket.categories.length > 0 ? (
                <div className="tj-activity-overview-legend">
                    {bucket.categories.map((segment) => {
                        const meta = getCategoryMeta(categories, segment.category);
                        const percent = Math.round((segment.minutes / bucketTotal) * 100);
                        return (
                            <span key={segment.category} className="tj-activity-overview-chip">
                                <span
                                    className="tj-activity-overview-chip-dot"
                                    style={{
                                        background: getCategoryTimelineColor(segment.category),
                                    }}
                                />
                                {meta.emoji} {percent}%
                            </span>
                        );
                    })}
                </div>
            ) : null}
            {bucketActivities.length > 0 ? (
                <ul className="tj-stats-drill-list">
                    {bucketActivities.slice(0, 4).map((item) => {
                        const meta = getCategoryMeta(categories, item.category);
                        return (
                            <li key={item.id}>
                                <span>
                                    {meta.emoji} {item.title}
                                </span>
                                <em>{formatDuration(item.durationMin)}</em>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className="tj-stats-drill-empty">这一时段还没有记录。</p>
            )}
        </article>
    );
}

export function CategoryDistributionList({
    categoryBreakdown,
    categories,
    metrics,
    maxCategoryMinutes,
    focusedCategory,
    onFocusCategory,
    showComparison = true,
}: {
    categoryBreakdown: StatsCategoryBreakdown[];
    categories: ActivityCategoryConfig[];
    metrics: StatsPeriodMetrics;
    maxCategoryMinutes: number;
    focusedCategory?: ActivityCategory | null;
    onFocusCategory?: (category: ActivityCategory | null) => void;
    showComparison?: boolean;
}) {
    const visible = categoryBreakdown.filter((item) => item.minutes > 0);

    if (visible.length === 0) {
        return null;
    }

    return (
        <div className="tj-card tj-distribution-card">
            {visible.map((item) => {
                const meta = getCategoryMeta(categories, item.category);
                const percent = Math.round((item.minutes / Math.max(metrics.totalMinutes, 1)) * 100);
                const active = focusedCategory === item.category;

                return (
                    <button
                        key={item.category}
                        type="button"
                        className={`tj-distribution-row${onFocusCategory ? ' tj-distribution-row-btn' : ''}${active ? ' tj-distribution-row-active' : ''}`}
                        onClick={() =>
                            onFocusCategory?.(active ? null : item.category)
                        }
                        disabled={!onFocusCategory}
                    >
                        <div className="tj-distribution-head">
                            <span>
                                {meta.emoji} {meta.label}
                            </span>
                            <div className="tj-distribution-meta">
                                {showComparison ? (
                                    <CategoryChange change={item.changePercent} />
                                ) : null}
                                <strong>{percent}%</strong>
                            </div>
                        </div>
                        <div className="tj-progress-track tj-progress-track-sm">
                            <div
                                className="tj-progress-fill"
                                style={{
                                    width: `${(item.minutes / maxCategoryMinutes) * 100}%`,
                                    background: getCategoryTimelineColor(item.category),
                                }}
                            />
                        </div>
                        <p>{formatDuration(item.minutes)}</p>
                    </button>
                );
            })}
        </div>
    );
}

export function StreakHeatmap({
    streak,
    dayMarkers,
}: {
    streak: number;
    dayMarkers: StatsDayMarker[];
}) {
    return (
        <div className="tj-stats-streak-card">
            <div className="tj-stats-streak-head">
                <strong>连续记录 {streak} 天</strong>
                <span>
                    {dayMarkers.filter((item) => item.hasRecord).length}/{dayMarkers.length} 天有记录
                </span>
            </div>
            <div className="tj-stats-streak-grid">
                {dayMarkers.map((item) => (
                    <div
                        key={item.dateKey}
                        className={`tj-stats-streak-cell${item.hasRecord ? ' tj-stats-streak-cell-on' : ''}`}
                        title={`${item.subLabel} ${item.weekday}`}
                    >
                        <span>{item.weekday}</span>
                        <em>{item.hasRecord ? '✓' : '·'}</em>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function DonutChart({
    categoryBreakdown,
    categories,
    metrics,
    focusedCategory,
    onSelectCategory,
    interactive = true,
}: {
    categoryBreakdown: StatsCategoryBreakdown[];
    categories: ActivityCategoryConfig[];
    metrics: StatsPeriodMetrics;
    focusedCategory: ActivityCategory | null;
    onSelectCategory?: (category: ActivityCategory | null) => void;
    interactive?: boolean;
}) {
    const visible = categoryBreakdown.filter((item) => item.minutes > 0);
    const total = Math.max(metrics.totalMinutes, 1);
    let cursor = 0;
    const segments = visible.map((item) => {
        const percent = (item.minutes / total) * 100;
        const start = cursor;
        cursor += percent;
        return {
            ...item,
            start,
            end: cursor,
            meta: getCategoryMeta(categories, item.category),
        };
    });
    const gradient =
        segments.length > 0
            ? `conic-gradient(${segments
                  .map(
                      (item) =>
                          `${getCategoryTimelineColor(item.category)} ${item.start}% ${item.end}%`,
                  )
                  .join(', ')})`
            : 'conic-gradient(#e1f4df 0% 100%)';

    return (
        <div className="tj-stats-donut-wrap">
            <div
                className="tj-stats-donut"
                style={{ background: gradient }}
                aria-label="生活配比环形图"
            >
                <div className="tj-stats-donut-hole">
                    <strong>{formatDuration(metrics.totalMinutes)}</strong>
                    <span>总时长</span>
                </div>
            </div>
            <div className="tj-stats-donut-legend">
                {segments.map((item) => (
                    <button
                        key={item.category}
                        type="button"
                        className={`tj-stats-donut-legend-item${focusedCategory === item.category ? ' tj-stats-donut-legend-item-active' : ''}`}
                        onClick={() =>
                            onSelectCategory?.(
                                focusedCategory === item.category ? null : item.category,
                            )
                        }
                        disabled={!interactive}
                    >
                        <span
                            className="tj-activity-overview-chip-dot"
                            style={{ background: getCategoryTimelineColor(item.category) }}
                        />
                        {item.meta.emoji} {item.meta.label}{' '}
                        {Math.round((item.minutes / total) * 100)}%
                    </button>
                ))}
            </div>
        </div>
    );
}

export function DayOverviewTrack({
    buckets,
    maxBucketMinutes,
}: {
    buckets: StatsChartBucket[];
    maxBucketMinutes: number;
}) {
    return (
        <div className="tj-stats-day-track-card">
            <div className="tj-activity-day-track-wrap">
                {buckets.map((bucket) => {
                    const width = Math.max(
                        bucket.minutes > 0 ? 8 : 4,
                        (bucket.minutes / maxBucketMinutes) * 100,
                    );
                    return (
                        <div key={bucket.id} className="tj-stats-day-track-row">
                            <span>{bucket.label}</span>
                            <div className="tj-activity-day-track">
                                {bucket.minutes > 0 ? (
                                    <div
                                        className="tj-stats-day-track-fill"
                                        style={{ width: `${width}%` }}
                                    >
                                        {bucket.categories.map((segment) => (
                                            <span
                                                key={segment.category}
                                                style={{
                                                    flexGrow: segment.minutes,
                                                    background: getCategoryTimelineColor(
                                                        segment.category,
                                                    ),
                                                }}
                                            />
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export function buildBalanceTips(
    bounds: StatsPeriodBounds,
    metrics: StatsPeriodMetrics,
    categoryBreakdown: StatsCategoryBreakdown[],
    categories: ActivityCategoryConfig[],
    moodLabel: string | null,
): string[] {
    const tips: string[] = [];
    const visible = categoryBreakdown.filter((item) => item.minutes > 0);

    visible.slice(0, 2).forEach((item) => {
        const meta = getCategoryMeta(categories, item.category);
        if (item.changePercent === null) {
            return;
        }
        if (item.changePercent > 0) {
            tips.push(
                `${meta.label}比${bounds.previousLabel}多 ${item.changePercent}%，当前 ${formatDuration(item.minutes)}。`,
            );
        } else if (item.changePercent < 0) {
            tips.push(
                `${meta.label}比${bounds.previousLabel}少 ${Math.abs(item.changePercent)}%，当前 ${formatDuration(item.minutes)}。`,
            );
        } else {
            tips.push(`${meta.label}与${bounds.previousLabel}持平。`);
        }
    });

    if (metrics.avgMood !== null && moodLabel) {
        tips.push(`平均心情 ${metrics.avgMood} · ${moodLabel}。`);
    }

    if (tips.length === 0 && metrics.totalMinutes > 0) {
        tips.push(`${bounds.label}记录结构较均衡，可以继续观察各类型的变化。`);
    }

    return tips.slice(0, 3);
}

export function InsightHero({ insight }: { insight: string }) {
    return (
        <article className="tj-card tj-stats-insight-hero">
            <div className="tj-stats-insight-icon">
                <Sparkles size={18} />
            </div>
            <p>{insight}</p>
        </article>
    );
}

export function MiniSparkline({
    buckets,
    maxBucketMinutes,
}: {
    buckets: StatsChartBucket[];
    maxBucketMinutes: number;
}) {
    const points = buckets
        .map((item, index) => {
            const x = buckets.length <= 1 ? 50 : (index / (buckets.length - 1)) * 100;
            const y =
                item.minutes > 0
                    ? 100 - (item.minutes / maxBucketMinutes) * 80 - 10
                    : 92;
            return `${x},${y}`;
        })
        .join(' ');

    return (
        <svg viewBox="0 0 100 100" className="tj-stats-sparkline" aria-hidden="true">
            <polyline points={points} />
            {buckets.map((item, index) => {
                const x = buckets.length <= 1 ? 50 : (index / (buckets.length - 1)) * 100;
                const y =
                    item.minutes > 0
                        ? 100 - (item.minutes / maxBucketMinutes) * 80 - 10
                        : 92;
                return <circle key={item.id} cx={x} cy={y} r="2.5" />;
            })}
        </svg>
    );
}

export function ReportDetailList({
    activities,
    categories,
    dayMarkers,
}: {
    activities: Activity[];
    categories: ActivityCategoryConfig[];
    dayMarkers: StatsDayMarker[];
}) {
    const rows = [...dayMarkers].reverse();

    return (
        <div className="tj-stats-report-detail">
            {rows.map((day) => {
                const dayActivities = getActivitiesInDateRange(
                    activities,
                    categories,
                    day.dateKey,
                    day.dateKey,
                );
                const minutes = dayActivities.reduce((sum, item) => sum + item.durationMin, 0);

                return (
                    <article key={day.dateKey} className="tj-stats-report-day">
                        <div className="tj-stats-report-day-head">
                            <strong>
                                {day.subLabel} · 周{day.weekday}
                            </strong>
                            <span>{minutes > 0 ? formatDuration(minutes) : '无记录'}</span>
                        </div>
                        {dayActivities.length > 0 ? (
                            <ul>
                                {dayActivities.slice(0, 3).map((item) => {
                                    const meta = getCategoryMeta(categories, item.category);
                                    return (
                                        <li key={item.id}>
                                            {meta.emoji} {item.title} · {formatDuration(item.durationMin)}
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : null}
                    </article>
                );
            })}
        </div>
    );
}

export function ReportOpenButton({
    open,
    onToggle,
}: {
    open: boolean;
    onToggle: () => void;
}) {
    return (
        <button type="button" className="tj-stats-report-open" onClick={onToggle}>
            {open ? '收起每日明细' : '查看每日明细'}
            <ChevronRight size={16} className={open ? 'tj-stats-report-open-icon-up' : ''} />
        </button>
    );
}
