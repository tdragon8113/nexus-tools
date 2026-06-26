import React, { useEffect, useMemo, useState } from 'react';
import { Flame } from 'lucide-react';
import {
    formatDuration,
    getActivitiesInDateRange,
    getCategoryMeta,
    getLevelInfo,
    getTotalXp,
    moodLabels,
    parseBucketDateRange,
} from '../../data';
import StatsRangeToolbar from './statsRangeToolbar';
import {
    BucketDrillPanel,
    CategoryDistributionList,
    ChangeBadge,
    DayOverviewTrack,
    DonutChart,
    ExcludeSleepToggle,
    InsightHero,
    MiniSparkline,
    ReportDetailList,
    ReportOpenButton,
    StackedBarChart,
    StreakHeatmap,
    buildBalanceTips,
    type StatsViewProps,
} from './statsShared';

function StatsHeader({
    kicker,
    title,
    lead,
}: {
    kicker: string;
    title: string;
    lead: string;
}) {
    return (
        <header className="tj-page-header">
            <p className="tj-kicker">{kicker}</p>
            <h1>{title}</h1>
            <p className="tj-page-lead">{lead}</p>
        </header>
    );
}

export function StatsDrillVariant(props: StatsViewProps) {
    const {
        activities,
        categories,
        rangeSelection,
        setRangeSelection,
        excludeSleep,
        setExcludeSleep,
        bounds,
        metrics,
        categoryBreakdown,
        chartBuckets,
        streak,
        insight,
        totalChange,
        xpChange,
        maxBucketMinutes,
        maxCategoryMinutes,
    } = props;

    const [selectedBucketId, setSelectedBucketId] = useState<string | null>(null);
    const [focusedCategory, setFocusedCategory] = useState<string | null>(null);

    useEffect(() => {
        setSelectedBucketId(null);
        setFocusedCategory(null);
    }, [rangeSelection, excludeSleep]);

    const selectedBucket =
        chartBuckets.find((item) => item.id === selectedBucketId) ??
        chartBuckets.find((item) => item.minutes > 0) ??
        chartBuckets[0] ??
        null;

    return (
        <div className="tj-page tj-stats-variant-drill">
            <StatsHeader
                kicker="数据洞察"
                title="统计"
                lead="先看结论，再点趋势柱查看具体某天的活动。"
            />
            <StatsRangeToolbar
                rangeSelection={rangeSelection}
                bounds={bounds}
                onChange={setRangeSelection}
            />
            <InsightHero insight={insight} />

            <section className="tj-stats-hero-metrics">
                <article className="tj-card tj-stat-card tj-stats-hero-metric-main">
                    <span>{bounds.label}总时长</span>
                    <strong>{metrics.totalMinutes > 0 ? formatDuration(metrics.totalMinutes) : '—'}</strong>
                    <ChangeBadge change={totalChange} previousLabel={bounds.previousLabel} />
                </article>
                <article className="tj-card tj-stat-card">
                    <span>记录天数</span>
                    <strong>{metrics.recordDays} 天</strong>
                    <span className="tj-stat-submeta">连续 {streak} 天</span>
                </article>
                <article className="tj-card tj-stat-card">
                    <span>获得 XP</span>
                    <strong>+{metrics.totalXp}</strong>
                    <ChangeBadge change={xpChange} previousLabel={bounds.previousLabel} />
                </article>
            </section>

            <section className="tj-section">
                <div className="tj-section-head">
                    <h2>{bounds.label}趋势</h2>
                    <span>{metrics.activityCount} 条记录</span>
                </div>
                <div className="tj-card tj-chart-card">
                    <StackedBarChart
                        buckets={chartBuckets}
                        categories={categories}
                        maxBucketMinutes={maxBucketMinutes}
                        selectedBucketId={selectedBucket?.id ?? null}
                        focusedCategory={focusedCategory}
                        onSelectBucket={setSelectedBucketId}
                    />
                </div>
                {selectedBucket ? (
                    <BucketDrillPanel
                        bucket={selectedBucket}
                        activities={activities}
                        categories={categories}
                    />
                ) : null}
            </section>

            <section className="tj-section">
                <div className="tj-section-head">
                    <h2>类型占比</h2>
                    <ExcludeSleepToggle excludeSleep={excludeSleep} onChange={setExcludeSleep} />
                </div>
                {categoryBreakdown.filter((item) => item.minutes > 0).length === 0 ? (
                    <div className="tj-empty-card">{bounds.label}还没有可统计的数据。</div>
                ) : (
                    <CategoryDistributionList
                        categoryBreakdown={categoryBreakdown}
                        categories={categories}
                        metrics={metrics}
                        maxCategoryMinutes={maxCategoryMinutes}
                        focusedCategory={focusedCategory}
                        onFocusCategory={setFocusedCategory}
                    />
                )}
            </section>
        </div>
    );
}

export function StatsBalanceVariant(props: StatsViewProps) {
    const {
        activities,
        categories,
        rangeSelection,
        setRangeSelection,
        excludeSleep,
        setExcludeSleep,
        bounds,
        metrics,
        previousMetrics,
        categoryBreakdown,
        chartBuckets,
        streak,
        moodLabel,
        maxBucketMinutes,
        dayMarkers,
    } = props;

    const [focusedCategory, setFocusedCategory] = useState<string | null>(null);
    const tips = useMemo(
        () =>
            buildBalanceTips(bounds, metrics, categoryBreakdown, categories, moodLabel),
        [bounds, metrics, categoryBreakdown, categories, moodLabel],
    );

    useEffect(() => {
        setFocusedCategory(null);
    }, [rangeSelection, excludeSleep]);

    const focusedActivities =
        focusedCategory !== null
            ? getActivitiesInDateRange(
                  activities,
                  categories,
                  bounds.startKey,
                  bounds.endKey,
              )
                  .filter((item) => item.category === focusedCategory)
                  .slice(0, 3)
            : [];

    return (
        <div className="tj-page tj-stats-variant-balance">
            <StatsHeader
                kicker="生活平衡"
                title="统计"
                lead="先看坚持记录与生活结构，再决定要不要调整节奏。"
            />
            <StatsRangeToolbar
                rangeSelection={rangeSelection}
                bounds={bounds}
                onChange={setRangeSelection}
            />

            <section className="tj-card tj-stats-balance-streak">
                <div className="tj-stats-balance-streak-top">
                    <span className="tj-profile-streak">
                        <Flame size={16} /> 连续 {streak} 天
                    </span>
                    <ExcludeSleepToggle excludeSleep={excludeSleep} onChange={setExcludeSleep} />
                </div>
                <StreakHeatmap streak={streak} dayMarkers={dayMarkers} />
            </section>

            <section className="tj-section">
                <div className="tj-section-head">
                    <h2>生活配比</h2>
                    <span>{bounds.label}</span>
                </div>
                <div className="tj-card">
                    <DonutChart
                        categoryBreakdown={categoryBreakdown}
                        categories={categories}
                        metrics={metrics}
                        focusedCategory={focusedCategory}
                        onSelectCategory={setFocusedCategory}
                    />
                    {excludeSleep ? (
                        <p className="tj-stats-balance-note">
                            已排除睡觉 · 醒后活动 {formatDuration(metrics.totalMinutes)}
                        </p>
                    ) : null}
                </div>
            </section>

            {focusedActivities.length > 0 ? (
                <section className="tj-section">
                    <div className="tj-section-head">
                        <h2>
                            {getCategoryMeta(categories, focusedCategory!).emoji}{' '}
                            {getCategoryMeta(categories, focusedCategory!).label} Top
                        </h2>
                    </div>
                    <ul className="tj-stats-drill-list tj-card">
                        {focusedActivities.map((item) => (
                            <li key={item.id}>
                                <span>{item.title}</span>
                                <em>{formatDuration(item.durationMin)}</em>
                            </li>
                        ))}
                    </ul>
                </section>
            ) : null}

            <section className="tj-section">
                <div className="tj-section-head">
                    <h2>平衡提示</h2>
                    <span>对比{bounds.previousLabel}</span>
                </div>
                <article className="tj-card tj-stats-balance-tips">
                    {tips.length > 0 ? (
                        <ul>
                            {tips.map((tip) => (
                                <li key={tip}>{tip}</li>
                            ))}
                        </ul>
                    ) : (
                        <p>{bounds.label}还没有足够数据生成提示。</p>
                    )}
                </article>
            </section>

            <section className="tj-section">
                <div className="tj-section-head">
                    <h2>每日节奏</h2>
                    <span>
                        总时长{' '}
                        {calcChangeText(
                            metrics.totalMinutes,
                            previousMetrics.totalMinutes,
                            bounds.previousLabel,
                        )}
                    </span>
                </div>
                <DayOverviewTrack
                    buckets={chartBuckets}
                    categories={categories}
                    maxBucketMinutes={maxBucketMinutes}
                />
            </section>
        </div>
    );
}

function calcChangeText(current: number, previous: number, previousLabel: string) {
    if (current === 0 && previous === 0) {
        return '暂无';
    }
    if (previous === 0) {
        return `较${previousLabel}新增`;
    }
    const change = Math.round(((current - previous) / previous) * 100);
    if (change > 0) {
        return `较${previousLabel} +${change}%`;
    }
    if (change < 0) {
        return `较${previousLabel} ${change}%`;
    }
    return `与${previousLabel}持平`;
}

export function StatsReportVariant(props: StatsViewProps) {
    const {
        activities,
        categories,
        rangeSelection,
        setRangeSelection,
        bounds,
        metrics,
        categoryBreakdown,
        chartBuckets,
        insight,
        rangeLabel,
        maxBucketMinutes,
        dayMarkers,
    } = props;

    const [detailOpen, setDetailOpen] = useState(false);
    const topCategories = categoryBreakdown.filter((item) => item.minutes > 0).slice(0, 3);

    useEffect(() => {
        setDetailOpen(false);
    }, [rangeSelection]);

    return (
        <div className="tj-page tj-stats-variant-report">
            <StatsHeader
                kicker="自动周报"
                title="统计"
                lead="一屏读完这段时期的记录摘要，需要时再展开明细。"
            />
            <StatsRangeToolbar
                rangeSelection={rangeSelection}
                bounds={bounds}
                onChange={setRangeSelection}
            />

            <article className="tj-card tj-stats-report-card">
                <p className="tj-stats-report-kicker">
                    📋 {rangeLabel} · {bounds.label}
                </p>
                <p className="tj-stats-report-copy">{insight}</p>

                <div className="tj-stats-report-metrics">
                    <div>
                        <span>总时长</span>
                        <strong>{formatDuration(metrics.totalMinutes)}</strong>
                    </div>
                    <div>
                        <span>记录天数</span>
                        <strong>
                            {metrics.recordDays}/{bounds.dayCount}
                        </strong>
                    </div>
                    <div>
                        <span>获得 XP</span>
                        <strong>+{metrics.totalXp}</strong>
                    </div>
                </div>

                <div className="tj-stats-report-split">
                    <div className="tj-stats-report-chart">
                        <span>趋势</span>
                        <MiniSparkline
                            buckets={chartBuckets}
                            maxBucketMinutes={maxBucketMinutes}
                        />
                    </div>
                    <div className="tj-stats-report-top3">
                        <span>类型 Top 3</span>
                        <ul>
                            {topCategories.map((item) => {
                                const meta = getCategoryMeta(categories, item.category);
                                const percent = Math.round(
                                    (item.minutes / Math.max(metrics.totalMinutes, 1)) * 100,
                                );
                                return (
                                    <li key={item.category}>
                                        {meta.emoji} {meta.label} {percent}%
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>

                <ReportOpenButton open={detailOpen} onToggle={() => setDetailOpen((value) => !value)} />
            </article>

            {detailOpen ? (
                <section className="tj-section">
                    <div className="tj-section-head">
                        <h2>每日明细</h2>
                    </div>
                    <ReportDetailList
                        activities={activities}
                        categories={categories}
                        dayMarkers={dayMarkers}
                    />
                </section>
            ) : null}
        </div>
    );
}

type StatsInnerTab = 'trend' | 'category' | 'mood' | 'growth';

const INNER_TABS: Array<{ id: StatsInnerTab; label: string }> = [
    { id: 'trend', label: '趋势' },
    { id: 'category', label: '类型' },
    { id: 'mood', label: '心情' },
    { id: 'growth', label: '成长' },
];

export function StatsTabsVariant(props: StatsViewProps) {
    const {
        activities,
        allActivities,
        categories,
        rangeSelection,
        setRangeSelection,
        bounds,
        metrics,
        previousMetrics,
        categoryBreakdown,
        chartBuckets,
        streak,
        moodLabel,
        totalChange,
        avgChange,
        xpChange,
        maxBucketMinutes,
        maxCategoryMinutes,
    } = props;

    const [innerTab, setInnerTab] = useState<StatsInnerTab>('trend');
    const [selectedBucketId, setSelectedBucketId] = useState<string | null>(null);
    const levelInfo = getLevelInfo(getTotalXp(allActivities));

    useEffect(() => {
        setSelectedBucketId(null);
    }, [rangeSelection, innerTab]);

    const selectedBucket =
        chartBuckets.find((item) => item.id === selectedBucketId) ?? null;

    const moodBuckets = chartBuckets.filter((item) => item.minutes > 0);

    return (
        <div className="tj-page tj-stats-variant-tabs">
            <StatsHeader
                kicker="分区浏览"
                title="统计"
                lead="按视角切换，每次只专注一类数据。"
            />

            <StatsRangeToolbar
                rangeSelection={rangeSelection}
                bounds={bounds}
                onChange={setRangeSelection}
            />

            <div className="tj-stats-inner-tabs" role="tablist" aria-label="统计视角">
                {INNER_TABS.map((item) => {
                    const active = innerTab === item.id;
                    return (
                        <button
                            key={item.id}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            className={`tj-stats-inner-tab${active ? ' tj-stats-inner-tab-active' : ''}`}
                            onClick={() => setInnerTab(item.id)}
                        >
                            {item.label}
                        </button>
                    );
                })}
            </div>

            {innerTab === 'trend' ? (
                <>
                    <section className="tj-stat-grid tj-stat-grid-expanded">
                        <article className="tj-card tj-stat-card">
                            <span>{bounds.label}总时长</span>
                            <strong>{formatDuration(metrics.totalMinutes)}</strong>
                            <ChangeBadge change={totalChange} previousLabel={bounds.previousLabel} />
                        </article>
                        <article className="tj-card tj-stat-card">
                            <span>日均时长</span>
                            <strong>{formatDuration(metrics.avgDailyMinutes)}</strong>
                            <ChangeBadge change={avgChange} previousLabel={bounds.previousLabel} />
                        </article>
                    </section>
                    <section className="tj-section">
                        <div className="tj-section-head">
                            <h2>{bounds.label}趋势</h2>
                            <span>{metrics.activityCount} 条记录</span>
                        </div>
                        <div className="tj-card tj-chart-card">
                            <StackedBarChart
                                buckets={chartBuckets}
                                categories={categories}
                                maxBucketMinutes={maxBucketMinutes}
                                selectedBucketId={selectedBucketId}
                                onSelectBucket={setSelectedBucketId}
                            />
                        </div>
                        {selectedBucket ? (
                            <BucketDrillPanel
                                bucket={selectedBucket}
                                activities={activities}
                                categories={categories}
                            />
                        ) : null}
                    </section>
                </>
            ) : null}

            {innerTab === 'category' ? (
                <section className="tj-section">
                    <div className="tj-section-head">
                        <h2>类型占比</h2>
                        <span>对比{bounds.previousLabel}</span>
                    </div>
                    {categoryBreakdown.filter((item) => item.minutes > 0).length === 0 ? (
                        <div className="tj-empty-card">{bounds.label}还没有可统计的数据。</div>
                    ) : (
                        <>
                            <div className="tj-card">
                                <DonutChart
                                    categoryBreakdown={categoryBreakdown}
                                    categories={categories}
                                    metrics={metrics}
                                    focusedCategory={null}
                                    interactive={false}
                                />
                            </div>
                            <CategoryDistributionList
                                categoryBreakdown={categoryBreakdown}
                                categories={categories}
                                metrics={metrics}
                                maxCategoryMinutes={maxCategoryMinutes}
                            />
                        </>
                    )}
                </section>
            ) : null}

            {innerTab === 'mood' ? (
                <section className="tj-section">
                    <div className="tj-section-head">
                        <h2>心情轨迹</h2>
                        <span>{bounds.label}</span>
                    </div>
                    {metrics.avgMood !== null && moodLabel ? (
                        <article className="tj-card tj-mood-summary-card">
                            <strong>{metrics.avgMood}</strong>
                            <span>{moodLabel}</span>
                            <p>
                                {bounds.label}共 {metrics.activityCount} 条记录的平均感受
                            </p>
                        </article>
                    ) : (
                        <div className="tj-empty-card">还没有足够的心情数据。</div>
                    )}
                    <div className="tj-card tj-stats-mood-track">
                        {moodBuckets.map((bucket) => {
                            const { startKey, endKey } = parseBucketDateRange(bucket.id);
                            const bucketActivities = getActivitiesInDateRange(
                                activities,
                                categories,
                                startKey,
                                endKey,
                            );
                            const avg =
                                bucketActivities.length > 0
                                    ? bucketActivities.reduce((sum, item) => sum + item.mood, 0) /
                                      bucketActivities.length
                                    : null;
                            const label =
                                avg !== null
                                    ? moodLabels[
                                          Math.min(
                                              moodLabels.length,
                                              Math.max(1, Math.round(avg)),
                                          ) - 1
                                      ]
                                    : '—';
                            return (
                                <div key={bucket.id} className="tj-stats-mood-row">
                                    <span>
                                        {bucket.label} {bucket.subLabel}
                                    </span>
                                    <strong>{avg !== null ? avg.toFixed(1) : '—'}</strong>
                                    <em>{label}</em>
                                </div>
                            );
                        })}
                    </div>
                </section>
            ) : null}

            {innerTab === 'growth' ? (
                <section className="tj-section">
                    <div className="tj-section-head">
                        <h2>成长记录</h2>
                        <span>Lv.{levelInfo.level}</span>
                    </div>
                    <article className="tj-card tj-level-card">
                        <div className="tj-level-top">
                            <div>
                                <strong>Lv.{levelInfo.level}</strong>
                                <p>累计 {getTotalXp(allActivities)} XP</p>
                            </div>
                            <span className="tj-xp-total">{levelInfo.currentXp} XP</span>
                        </div>
                        <div className="tj-progress-track">
                            <div
                                className="tj-progress-fill"
                                style={{ width: `${levelInfo.progress}%` }}
                            />
                        </div>
                        <p className="tj-progress-caption">
                            再积累 {levelInfo.nextLevelXp - levelInfo.currentXp} XP 升级
                        </p>
                    </article>
                    <div className="tj-stat-grid">
                        <article className="tj-card tj-stat-card">
                            <span>{bounds.label} XP</span>
                            <strong>+{metrics.totalXp}</strong>
                            <ChangeBadge change={xpChange} previousLabel={bounds.previousLabel} />
                        </article>
                        <article className="tj-card tj-stat-card">
                            <span>连续记录</span>
                            <strong>{streak} 天</strong>
                            <span className="tj-stat-submeta">{metrics.recordDays} 天有记录</span>
                        </article>
                    </div>
                    <div className="tj-card tj-chart-card">
                        <StackedBarChart
                            buckets={chartBuckets}
                            categories={categories}
                            maxBucketMinutes={maxBucketMinutes}
                            compact
                        />
                    </div>
                    <p className="tj-stats-growth-caption">
                        柱状高度代表每期获得 XP 的活动量，越高说明记录越活跃。
                    </p>
                </section>
            ) : null}
        </div>
    );
}

export function renderStatsVariant(variant: string, props: StatsViewProps) {
    switch (variant) {
        case 'balance':
            return <StatsBalanceVariant {...props} />;
        case 'report':
            return <StatsReportVariant {...props} />;
        case 'tabs':
            return <StatsTabsVariant {...props} />;
        case 'drill':
        default:
            return <StatsDrillVariant {...props} />;
    }
}
