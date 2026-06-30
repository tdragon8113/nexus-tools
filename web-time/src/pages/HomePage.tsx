import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Cloud, Plus, Sparkles } from 'lucide-react';
import RichNoteContent from '../components/RichNoteContent';
import RichNoteEditor from '../components/RichNoteEditor';
import { hasNoteContent } from '../domain/noteRichText';
import {
    getTodayActivities,
    getTodayCategoryStats,
    getTotalXp,
} from '../domain/dates';
import { getLevelInfo } from '../domain/level';
import {
    ACTIVE_RECORDING_ID,
    type ActiveRecordingSession,
    getActiveRecordingDurationMin,
    getActiveRecordingElapsedMs,
    isActiveRecordingToday,
} from '../domain/recording';
import {
    formatDateKey,
    formatDuration,
    formatElapsed,
    formatTimeLabel,
    parseApiDateTime,
    getActivityEndAt,
    getActivityStartAt,
    getCategoryMeta,
    getCategoryTimelineColor,
} from '../domain/record';
import type { Activity, ActivityCategoryConfig, ActivitySummary, AuthSession, Reflection } from '../domain/types';

type TimelineEntry =
    | { kind: 'saved'; activity: Activity }
    | { kind: 'recording'; session: ActiveRecordingSession };

type HomePageProps = {
    activities: Activity[];
    categories: ActivityCategoryConfig[];
    reflections: Reflection[];
    summary?: ActivitySummary | null;
    activeRecording?: ActiveRecordingSession | null;
    authSession?: AuthSession | null;
    onQuickRecord: () => void;
    onOpenRecording: () => void;
    onAddReflection: (content: string) => void;
    onOpenActivity: (activityId: string) => void;
    onOpenLogin: () => void;
};

const TIMELINE_PREVIEW_COUNT = 4;
const TIMELINE_DIMMED_SEGMENT_COLOR = '#c4cad2';

export default function HomePage({
    activities,
    categories,
    reflections,
    summary = null,
    activeRecording = null,
    authSession = null,
    onQuickRecord,
    onOpenRecording,
    onAddReflection,
    onOpenActivity,
    onOpenLogin,
}: HomePageProps) {
    const [showAllActivities, setShowAllActivities] = useState(false);
    const [focusedCategoryId, setFocusedCategoryId] = useState<string | null>(null);
    const [isReflectionEditing, setIsReflectionEditing] = useState(false);
    const [reflectionDraft, setReflectionDraft] = useState('');
    const [locatedActivityId, setLocatedActivityId] = useState<string | null>(null);
    const [pendingScrollActivityId, setPendingScrollActivityId] = useState<string | null>(null);
    const [nowTick, setNowTick] = useState(() => Date.now());
    const activityRowRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
    const locateHighlightTimerRef = useRef<number | null>(null);

    const totalXp = summary?.totalXp ?? getTotalXp(activities);
    const levelInfoFromXp = getLevelInfo(totalXp);
    const levelInfo = summary
        ? {
              level: summary.level,
              currentXp: levelInfoFromXp.currentXp,
              nextLevelXp: levelInfoFromXp.nextLevelXp,
              progress: Math.round(summary.levelProgress * 100),
          }
        : levelInfoFromXp;

    const activeRecordingToday =
        activeRecording && isActiveRecordingToday(activeRecording) ? activeRecording : null;

    const savedTodayActivities = useMemo(() => {
        const today = getTodayActivities(activities, categories);
        if (!activeRecordingToday) {
            return today;
        }
        return today.filter((item) => item.id !== activeRecordingToday.activityId);
    }, [activities, categories, activeRecordingToday]);

    const todayDuration = savedTodayActivities.reduce((sum, item) => sum + item.durationMin, 0);
    const recordingDurationMin = activeRecordingToday
        ? getActiveRecordingDurationMin(activeRecordingToday, nowTick)
        : 0;
    const todayDurationWithRecording = todayDuration + recordingDurationMin;
    const todayEntryCount = savedTodayActivities.length + (activeRecordingToday ? 1 : 0);

    const todayCategoryStats = useMemo(() => {
        const stats = getTodayCategoryStats(
            activeRecordingToday
                ? activities.filter((item) => item.id !== activeRecordingToday.activityId)
                : activities,
            categories,
        );
        if (!activeRecordingToday || recordingDurationMin <= 0) {
            return stats;
        }

        const totals = new Map(stats.map((item) => [item.category, item.minutes]));
        totals.set(
            activeRecordingToday.category,
            (totals.get(activeRecordingToday.category) ?? 0) + recordingDurationMin,
        );

        const knownIds = new Set(categories.map((item) => item.id));
        const result = categories
            .map((item) => ({
                category: item.id,
                minutes: totals.get(item.id) ?? 0,
            }))
            .filter((item) => item.minutes > 0);

        totals.forEach((minutes, categoryId) => {
            if (!knownIds.has(categoryId) && minutes > 0) {
                result.push({ category: categoryId, minutes });
            }
        });

        return result.sort((a, b) => b.minutes - a.minutes);
    }, [activities, categories, activeRecordingToday, recordingDurationMin]);

    const focusedCategoryStat = useMemo(
        () => todayCategoryStats.find((item) => item.category === focusedCategoryId) ?? null,
        [todayCategoryStats, focusedCategoryId],
    );

    const timelineEntries = useMemo((): TimelineEntry[] => {
        const savedEntries: TimelineEntry[] = savedTodayActivities.map((activity) => ({
            kind: 'saved',
            activity,
        }));

        if (!activeRecordingToday) {
            return savedEntries;
        }

        return [{ kind: 'recording', session: activeRecordingToday }, ...savedEntries];
    }, [savedTodayActivities, activeRecordingToday]);

    const visibleTimelineEntries = useMemo(() => {
        if (showAllActivities) {
            return timelineEntries;
        }

        const recordingEntry = timelineEntries.find((entry) => entry.kind === 'recording') ?? null;
        const savedEntries = timelineEntries.filter((entry) => entry.kind === 'saved');
        const savedPreviewCount = recordingEntry
            ? TIMELINE_PREVIEW_COUNT - 1
            : TIMELINE_PREVIEW_COUNT;

        if (recordingEntry) {
            return [recordingEntry, ...savedEntries.slice(0, savedPreviewCount)];
        }

        return savedEntries.slice(0, TIMELINE_PREVIEW_COUNT);
    }, [showAllActivities, timelineEntries]);

    const dayTimeline = useMemo(() => {
        if (timelineEntries.length === 0) {
            return null;
        }

        const timelineItems = timelineEntries.map((entry) => {
            if (entry.kind === 'recording') {
                const startMs = parseApiDateTime(entry.session.startedAt).getTime();
                const meta = getCategoryMeta(categories, entry.session.category);
                return {
                    id: ACTIVE_RECORDING_ID,
                    category: entry.session.category,
                    startMs,
                    endMs: nowTick,
                    isLive: true,
                    title: `${meta.label} ${formatTimeLabel(entry.session.startedAt)}–进行中`,
                };
            }

            const startMs = parseApiDateTime(getActivityStartAt(entry.activity)).getTime();
            const endMs = parseApiDateTime(getActivityEndAt(entry.activity)).getTime();
            const meta = getCategoryMeta(categories, entry.activity.category);
            return {
                id: entry.activity.id,
                category: entry.activity.category,
                startMs,
                endMs,
                isLive: false,
                title: `${meta.label} ${formatTimeLabel(getActivityStartAt(entry.activity))}–${formatTimeLabel(getActivityEndAt(entry.activity))}`,
            };
        });

        const sorted = [...timelineItems].sort((a, b) => a.startMs - b.startMs);
        const windowStartMs = Math.min(...sorted.map((item) => item.startMs));
        const windowEndMs = Math.max(...sorted.map((item) => item.endMs));
        const spanMs = Math.max(windowEndMs - windowStartMs, 30 * 60 * 1000);
        const axisEndMs = windowStartMs + spanMs;
        const midMs = windowStartMs + spanMs / 2;

        const allSegments = sorted.map((item) => ({
            id: item.id,
            category: item.category,
            isLive: item.isLive,
            left: ((item.startMs - windowStartMs) / spanMs) * 100,
            width: Math.max(1.5, ((item.endMs - item.startMs) / spanMs) * 100),
            color: getCategoryTimelineColor(item.category),
            title: item.title,
        }));

        const segments = allSegments.map((segment) => {
            const isDimmed = Boolean(focusedCategoryId && segment.category !== focusedCategoryId);
            return {
                ...segment,
                isDimmed,
                displayColor: isDimmed ? TIMELINE_DIMMED_SEGMENT_COLOR : segment.color,
            };
        });

        return {
            segments,
            axisStart: formatTimeLabel(new Date(windowStartMs)),
            axisMid: formatTimeLabel(new Date(midMs)),
            axisEnd: formatTimeLabel(new Date(axisEndMs)),
            isCategoryFiltered: Boolean(focusedCategoryId),
        };
    }, [timelineEntries, categories, focusedCategoryId, nowTick]);

    const todayKey = formatDateKey(new Date());
    const todayReflection = reflections.find(
        (item) => (item.scope ?? 'day') === 'day' && item.date === todayKey,
    );

    const hasMoreTimelineEntries = timelineEntries.length > TIMELINE_PREVIEW_COUNT;

    const getTimelineEntryId = (entry: TimelineEntry) =>
        entry.kind === 'recording' ? ACTIVE_RECORDING_ID : entry.activity.id;

    useEffect(() => {
        if (!activeRecordingToday) {
            return undefined;
        }
        const timer = window.setInterval(() => setNowTick(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, [activeRecordingToday]);

    useEffect(() => {
        setShowAllActivities(false);
    }, [timelineEntries.length]);

    useEffect(() => {
        if (
            focusedCategoryId &&
            !todayCategoryStats.some((item) => item.category === focusedCategoryId)
        ) {
            setFocusedCategoryId(null);
        }
    }, [todayCategoryStats, focusedCategoryId]);

    const handleFocusCategory = (categoryId: string) => {
        setFocusedCategoryId((current) => (current === categoryId ? null : categoryId));
    };

    const scrollToActivityRow = (activityId: string) => {
        const row = activityRowRefs.current.get(activityId);
        if (!row) {
            return;
        }

        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setLocatedActivityId(activityId);

        if (locateHighlightTimerRef.current !== null) {
            window.clearTimeout(locateHighlightTimerRef.current);
        }

        locateHighlightTimerRef.current = window.setTimeout(() => {
            setLocatedActivityId(null);
            locateHighlightTimerRef.current = null;
        }, 1800);
    };

    const handleLocateActivity = (entryId: string) => {
        const entryIndex = timelineEntries.findIndex((entry) => getTimelineEntryId(entry) === entryId);
        if (entryIndex === -1) {
            return;
        }

        const isHidden = entryIndex >= TIMELINE_PREVIEW_COUNT && !showAllActivities;
        if (isHidden) {
            setPendingScrollActivityId(entryId);
            setShowAllActivities(true);
            return;
        }

        scrollToActivityRow(entryId);
    };

    useEffect(() => {
        if (!pendingScrollActivityId || !showAllActivities) {
            return;
        }

        const activityId = pendingScrollActivityId;
        let innerFrameId = 0;
        const frameId = window.requestAnimationFrame(() => {
            innerFrameId = window.requestAnimationFrame(() => {
                scrollToActivityRow(activityId);
                setPendingScrollActivityId(null);
            });
        });

        return () => {
            window.cancelAnimationFrame(frameId);
            if (innerFrameId) {
                window.cancelAnimationFrame(innerFrameId);
            }
        };
    }, [pendingScrollActivityId, showAllActivities, visibleTimelineEntries]);

    useEffect(
        () => () => {
            if (locateHighlightTimerRef.current !== null) {
                window.clearTimeout(locateHighlightTimerRef.current);
            }
        },
        [],
    );

    const handleAddReflection = () => {
        setReflectionDraft(todayReflection?.content ?? '');
        setIsReflectionEditing(true);
    };

    const handleSaveReflection = () => {
        if (!hasNoteContent(reflectionDraft)) {
            return;
        }
        onAddReflection(reflectionDraft);
        setIsReflectionEditing(false);
        setReflectionDraft('');
    };

    const handleCancelReflection = () => {
        setIsReflectionEditing(false);
        setReflectionDraft('');
    };

    return (
        <div className="tj-page">
            <header className="tj-home-header">
                <div>
                    <p className="tj-kicker">今日概览</p>
                    <h1 className="tj-home-title">时光记</h1>
                </div>
                <div className="tj-level-badge">
                    <span>Lv.{levelInfo.level}</span>
                </div>
            </header>

            {!authSession ? (
                <button type="button" className="tj-card tj-auth-banner" onClick={onOpenLogin}>
                    <Cloud size={18} />
                    <span>登录账户，继续使用时光记</span>
                    <ChevronRight size={16} />
                </button>
            ) : null}

            <section className="tj-card tj-level-card">
                <div className="tj-level-top">
                    <div>
                        <strong>生活旅人</strong>
                        <p>再积累 {levelInfo.nextLevelXp - levelInfo.currentXp} XP 升级</p>
                    </div>
                    <span className="tj-xp-total">{totalXp} XP</span>
                </div>
                <div className="tj-progress-track">
                    <div className="tj-progress-fill" style={{ width: `${levelInfo.progress}%` }} />
                </div>
                <p className="tj-progress-caption">
                    {levelInfo.currentXp} / {levelInfo.nextLevelXp} XP
                </p>
            </section>

            <section className="tj-card tj-summary-card">
                <div>
                    <span className="tj-summary-label">今日已记录</span>
                    <strong className="tj-summary-value">{formatDuration(todayDurationWithRecording)}</strong>
                </div>
                <button type="button" className="tj-primary-btn" onClick={onQuickRecord}>
                    <Plus size={18} />
                    快速记录
                </button>
            </section>

            <section className="tj-section">
                <div className="tj-section-head">
                    <h2>今日活动</h2>
                </div>

                {timelineEntries.length === 0 ? (
                    <div className="tj-empty-card">
                        <Sparkles size={20} />
                        <p>还没有记录，点「快速记录」开始今天的第一条。</p>
                    </div>
                ) : (
                    <div className="tj-activity-panel">
                        <article
                            className={`tj-card tj-activity-overview${dayTimeline?.isCategoryFiltered ? ' tj-activity-overview-is-focused' : ''}`}
                        >
                            <div className="tj-activity-overview-head">
                                {focusedCategoryStat ? (
                                    <>
                                        <strong>
                                            {getCategoryMeta(categories, focusedCategoryStat.category).emoji}{' '}
                                            {getCategoryMeta(categories, focusedCategoryStat.category).label}
                                        </strong>
                                        <span>·</span>
                                        <span>
                                            {Math.round(
                                                (focusedCategoryStat.minutes / Math.max(todayDurationWithRecording, 1)) * 100,
                                            )}
                                            % · {formatDuration(focusedCategoryStat.minutes)}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <strong>{todayEntryCount} 条</strong>
                                        <span>·</span>
                                        <span>{formatDuration(todayDurationWithRecording)}</span>
                                    </>
                                )}
                            </div>

                            {dayTimeline ? (
                                <>
                                    <div className="tj-activity-day-track-wrap">
                                        <div
                                            className="tj-activity-day-track"
                                            aria-label={
                                                dayTimeline.isCategoryFiltered
                                                    ? '选中类型活动时间轴'
                                                    : '今日活动时间轴'
                                            }
                                        >
                                            {dayTimeline.segments.map((segment) => (
                                                <button
                                                    key={segment.id}
                                                    type="button"
                                                    className={`tj-activity-day-segment${segment.isDimmed ? ' tj-activity-day-segment-is-dimmed' : ''}${segment.isLive ? ' tj-activity-day-segment-is-live' : ''}${locatedActivityId === segment.id ? ' tj-activity-day-segment-is-located' : ''}`}
                                                    style={{
                                                        left: `${segment.left}%`,
                                                        width: `${segment.width}%`,
                                                        background: segment.displayColor,
                                                    }}
                                                    title={segment.title}
                                                    aria-label={`定位到 ${segment.title}`}
                                                    onClick={() => handleLocateActivity(segment.id)}
                                                />
                                            ))}
                                        </div>
                                        <div className="tj-activity-day-axis">
                                            <span>{dayTimeline.axisStart}</span>
                                            <span>{dayTimeline.axisMid}</span>
                                            <span>{dayTimeline.axisEnd}</span>
                                        </div>
                                    </div>
                                    <div className="tj-activity-overview-legend">
                                        {todayCategoryStats.map((item) => {
                                            const meta = getCategoryMeta(categories, item.category);
                                            const percent = Math.round(
                                                (item.minutes / Math.max(todayDurationWithRecording, 1)) * 100,
                                            );
                                            const isActive = focusedCategoryId === item.category;
                                            return (
                                                <button
                                                    key={item.category}
                                                    type="button"
                                                    className={`tj-activity-overview-chip${isActive ? ' tj-activity-overview-chip-is-active' : ''}`}
                                                    aria-pressed={isActive}
                                                    onClick={() => handleFocusCategory(item.category)}
                                                >
                                                    <span
                                                        className="tj-activity-overview-chip-dot"
                                                        style={{
                                                            background: getCategoryTimelineColor(item.category),
                                                        }}
                                                    />
                                                    {meta.emoji} {meta.label} {percent}%
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : null}
                        </article>

                        <div className="tj-activity-timeline">
                            {visibleTimelineEntries.map((entry, index) => {
                                const isLast = index === visibleTimelineEntries.length - 1;
                                const entryId = getTimelineEntryId(entry);

                                if (entry.kind === 'recording') {
                                    const meta = getCategoryMeta(categories, entry.session.category);
                                    const elapsedMs = getActiveRecordingElapsedMs(entry.session, nowTick);
                                    return (
                                        <button
                                            key={entryId}
                                            type="button"
                                            ref={(node) => {
                                                if (node) {
                                                    activityRowRefs.current.set(entryId, node);
                                                } else {
                                                    activityRowRefs.current.delete(entryId);
                                                }
                                            }}
                                            className={`tj-timeline-activity-row tj-timeline-activity-row-is-recording${locatedActivityId === entryId ? ' tj-timeline-activity-row-is-located' : ''}`}
                                            onClick={onOpenRecording}
                                        >
                                            <div className="tj-timeline-leading">
                                                <div className="tj-timeline-time-range">
                                                    <span className="tj-timeline-time-start">
                                                        {formatTimeLabel(entry.session.startedAt)}
                                                    </span>
                                                    <span className="tj-timeline-time-sep">–</span>
                                                    <span className="tj-timeline-time-end tj-timeline-time-live">
                                                        进行中
                                                    </span>
                                                </div>
                                                <div className="tj-timeline-rail" aria-hidden="true">
                                                    <span
                                                        className="tj-timeline-dot tj-timeline-dot-live"
                                                        style={{
                                                            background: getCategoryTimelineColor(
                                                                entry.session.category,
                                                            ),
                                                        }}
                                                    />
                                                    {!isLast ? <span className="tj-timeline-line" /> : null}
                                                </div>
                                            </div>
                                            <div className="tj-timeline-card">
                                                <span className="tj-timeline-emoji">{meta.emoji}</span>
                                                <div className="tj-timeline-copy">
                                                    <strong>
                                                        {entry.session.title.trim() || meta.label}
                                                    </strong>
                                                    <p>
                                                        {meta.label} · {formatElapsed(elapsedMs)} · 计时中
                                                    </p>
                                                </div>
                                                <ChevronRight size={16} className="tj-timeline-chevron" />
                                            </div>
                                        </button>
                                    );
                                }

                                const item = entry.activity;
                                const meta = getCategoryMeta(categories, item.category);
                                const startAt = getActivityStartAt(item);
                                const endAt = getActivityEndAt(item);
                                return (
                                    <button
                                        key={entryId}
                                        type="button"
                                        ref={(node) => {
                                            if (node) {
                                                activityRowRefs.current.set(entryId, node);
                                            } else {
                                                activityRowRefs.current.delete(entryId);
                                            }
                                        }}
                                        className={`tj-timeline-activity-row${locatedActivityId === entryId ? ' tj-timeline-activity-row-is-located' : ''}`}
                                        onClick={() => onOpenActivity(item.id)}
                                    >
                                        <div className="tj-timeline-leading">
                                            <div className="tj-timeline-time-range">
                                                <span className="tj-timeline-time-start">
                                                    {formatTimeLabel(startAt)}
                                                </span>
                                                <span className="tj-timeline-time-sep">–</span>
                                                <span className="tj-timeline-time-end">
                                                    {formatTimeLabel(endAt)}
                                                </span>
                                            </div>
                                            <div className="tj-timeline-rail" aria-hidden="true">
                                                <span className="tj-timeline-dot" />
                                                {!isLast ? <span className="tj-timeline-line" /> : null}
                                            </div>
                                        </div>
                                        <div className="tj-timeline-card">
                                            <span className="tj-timeline-emoji">{meta.emoji}</span>
                                            <div className="tj-timeline-copy">
                                                <strong>{item.title}</strong>
                                                <p>
                                                    {meta.label} · {formatDuration(item.durationMin)} · +{item.xp} XP
                                                </p>
                                            </div>
                                            <ChevronRight size={16} className="tj-timeline-chevron" />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {hasMoreTimelineEntries ? (
                            <button
                                type="button"
                                className="tj-text-btn tj-activity-expand-btn"
                                onClick={() => setShowAllActivities((current) => !current)}
                            >
                                {showAllActivities
                                    ? '收起'
                                    : `查看全部 ${timelineEntries.length} 条`}
                            </button>
                        ) : null}
                    </div>
                )}
            </section>

            <section className="tj-section">
                <div className="tj-section-head">
                    <h2>今日感悟</h2>
                    {!isReflectionEditing ? (
                        <button type="button" className="tj-text-btn" onClick={handleAddReflection}>
                            {todayReflection ? '编辑' : '写一条'}
                        </button>
                    ) : null}
                </div>

                {isReflectionEditing ? (
                    <article className="tj-card tj-reflection-editor">
                        <RichNoteEditor
                            value={reflectionDraft}
                            onChange={setReflectionDraft}
                            placeholder="例如：今天运动完心情很好，下午效率也不错……"
                        />
                        <div className="tj-reflection-editor-actions">
                            <button
                                type="button"
                                className="tj-secondary-btn"
                                onClick={handleCancelReflection}
                            >
                                取消
                            </button>
                            <button
                                type="button"
                                className="tj-primary-btn"
                                onClick={handleSaveReflection}
                                disabled={!hasNoteContent(reflectionDraft)}
                            >
                                保存
                            </button>
                        </div>
                    </article>
                ) : todayReflection ? (
                    <article className="tj-card tj-reflection-card">
                        <RichNoteContent html={todayReflection.content} />
                    </article>
                ) : (
                    <button type="button" className="tj-card tj-reflection-empty" onClick={handleAddReflection}>
                        <span>记录今天的感受与收获</span>
                        <ChevronRight size={18} />
                    </button>
                )}
            </section>
        </div>
    );
}
