import React, { useEffect, useMemo, useState } from 'react';
import { Clock3, Play } from 'lucide-react';
import DatePickerField from '../components/DatePickerField';
import RichNoteEditor from '../components/RichNoteEditor';
import {
    ActiveRecordingSession,
    Activity,
    ActivityCategory,
    ActivityCategoryConfig,
    calculateXp,
    combineDateKeyAndTime,
    createActivity,
    findOverlappingActivities,
    formatActivityTimeRangeLabel,
    formatDateKey,
    formatDuration,
    formatElapsed,
    formatTimeLabel,
    getActivityTimeRangeMs,
    getCategoryMeta,
    minutesBetween,
    moodLabels,
} from '../data';

type RecordPageProps = {
    activities: Activity[];
    categories: ActivityCategoryConfig[];
    initialActiveRecording?: ActiveRecordingSession | null;
    onSave: (activity: ReturnType<typeof createActivity>) => void;
    onActiveSessionChange?: (session: ActiveRecordingSession | null) => void;
};

type RecordPhase = 'idle' | 'active';
type RecordMode = 'live' | 'backfill';

type ActiveSession = {
    category: ActivityCategory;
    title: string;
    startedAt: Date;
};

function buildSessionFromRecording(recording: ActiveRecordingSession): ActiveSession {
    return {
        category: recording.category,
        title: recording.title,
        startedAt: new Date(recording.startedAt),
    };
}

function getInitialRecordState(recording?: ActiveRecordingSession | null): {
    phase: RecordPhase;
    session: ActiveSession | null;
} {
    if (!recording) {
        return { phase: 'idle', session: null };
    }
    return {
        phase: 'active',
        session: buildSessionFromRecording(recording),
    };
}

function defaultBackfillEndTime(now = new Date()): string {
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${mins}`;
}

function defaultBackfillStartTime(now = new Date()): string {
    const start = new Date(now.getTime() - 60 * 60000);
    const hours = String(start.getHours()).padStart(2, '0');
    const mins = String(start.getMinutes()).padStart(2, '0');
    return `${hours}:${mins}`;
}

function getBackfillRangeError(
    dateKey: string,
    startTime: string,
    endTime: string,
    now = new Date(),
): string | null {
    const startedAt = combineDateKeyAndTime(dateKey, startTime);
    const endedAt = combineDateKeyAndTime(dateKey, endTime);

    if (startedAt.getTime() >= endedAt.getTime()) {
        return '开始时间不能大于结束时间';
    }
    if (endedAt.getTime() > now.getTime()) {
        return '不能补录未来的时间';
    }
    return null;
}

function OverlapWarning({
    overlaps,
    categories,
    onConfirm,
    onCancel,
    confirmLabel,
}: {
    overlaps: Activity[];
    categories: ActivityCategoryConfig[];
    onConfirm: () => void;
    onCancel: () => void;
    confirmLabel: string;
}) {
    return (
        <section className="tj-card tj-overlap-warning">
            <h2 className="tj-overlap-warning-title">与已有记录时间重叠</h2>
            <p className="tj-overlap-warning-lead">
                以下记录与当前时段有交集。若仍保存，时间轴会同时展示，统计时长也会重复计入。
            </p>
            <ul className="tj-overlap-warning-list">
                {overlaps.map((item) => (
                    <li key={item.id}>{formatActivityTimeRangeLabel(item, categories)}</li>
                ))}
            </ul>
            <div className="tj-action-stack">
                <button type="button" className="tj-primary-btn tj-primary-btn-block" onClick={onConfirm}>
                    {confirmLabel}
                </button>
                <button type="button" className="tj-secondary-btn tj-secondary-btn-block" onClick={onCancel}>
                    返回修改时间
                </button>
            </div>
        </section>
    );
}

export default function RecordPage({
    activities,
    categories,
    initialActiveRecording = null,
    onSave,
    onActiveSessionChange,
}: RecordPageProps) {
    const initialState = getInitialRecordState(initialActiveRecording);
    const [phase, setPhase] = useState<RecordPhase>(initialState.phase);
    const [recordMode, setRecordMode] = useState<RecordMode>('live');
    const [session, setSession] = useState<ActiveSession | null>(initialState.session);
    const [category, setCategory] = useState<ActivityCategory>(
        initialState.session?.category ?? categories[0]?.id ?? 'study',
    );
    const [title, setTitle] = useState(initialState.session?.title ?? '');
    const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5>(4);
    const [note, setNote] = useState('');
    const [nowTick, setNowTick] = useState(() => Date.now());
    const [backfillDateKey, setBackfillDateKey] = useState(() => formatDateKey(new Date()));
    const [backfillStartTime, setBackfillStartTime] = useState(() => defaultBackfillStartTime());
    const [backfillEndTime, setBackfillEndTime] = useState(() => defaultBackfillEndTime());
    const [overlapPrompt, setOverlapPrompt] = useState<{
        activity: Activity;
        overlaps: Activity[];
        onCommitted: () => void;
    } | null>(null);

    const clearOverlapPrompt = () => setOverlapPrompt(null);

    useEffect(() => {
        if (!categories.some((item) => item.id === category)) {
            setCategory(categories[0]?.id ?? 'study');
        }
    }, [categories, category]);

    useEffect(() => {
        if (phase !== 'active' || !session) {
            return undefined;
        }
        const timer = window.setInterval(() => setNowTick(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, [phase, session]);

    useEffect(() => {
        if (phase === 'active' && session) {
            onActiveSessionChange?.({
                category: session.category,
                title: session.title,
                startedAt: session.startedAt.toISOString(),
            });
            return;
        }
        onActiveSessionChange?.(null);
    }, [phase, session, onActiveSessionChange]);

    const selectedMeta = getCategoryMeta(categories, category);

    const recordingElapsedMs = session
        ? new Date(nowTick).getTime() - session.startedAt.getTime()
        : 0;

    const liveDurationMin = session
        ? Math.max(1, minutesBetween(session.startedAt, new Date(nowTick)))
        : 0;

    const backfillDurationMin = useMemo(() => {
        const startedAt = combineDateKeyAndTime(backfillDateKey, backfillStartTime);
        const endedAt = combineDateKeyAndTime(backfillDateKey, backfillEndTime);
        if (endedAt.getTime() <= startedAt.getTime()) {
            return 0;
        }
        return minutesBetween(startedAt, endedAt);
    }, [backfillDateKey, backfillEndTime, backfillStartTime]);

    const backfillRangeError = useMemo(
        () => getBackfillRangeError(backfillDateKey, backfillStartTime, backfillEndTime),
        [backfillDateKey, backfillEndTime, backfillStartTime],
    );

    const backfillOverlaps = useMemo(() => {
        if (backfillDurationMin <= 0) {
            return [];
        }
        const startedAt = combineDateKeyAndTime(backfillDateKey, backfillStartTime);
        const endedAt = combineDateKeyAndTime(backfillDateKey, backfillEndTime);
        return findOverlappingActivities(activities, startedAt.getTime(), endedAt.getTime());
    }, [activities, backfillDateKey, backfillDurationMin, backfillEndTime, backfillStartTime]);

    const previewXp = useMemo(() => {
        const durationMin = recordMode === 'backfill' ? backfillDurationMin : liveDurationMin;
        if (recordMode === 'backfill' && durationMin <= 0) {
            return 0;
        }
        if (recordMode === 'live' && !session) {
            return 0;
        }
        return calculateXp(categories, category, durationMin || liveDurationMin);
    }, [backfillDurationMin, categories, category, liveDurationMin, recordMode, session]);

    const resetDraft = () => {
        setTitle('');
        setNote('');
        setMood(4);
        clearOverlapPrompt();
    };

    const commitActivity = (activity: Activity, onCommitted: () => void) => {
        onSave(activity);
        onCommitted();
        clearOverlapPrompt();
    };

    const requestSave = (activity: Activity, onCommitted: () => void) => {
        const range = getActivityTimeRangeMs(activity);
        const overlaps = findOverlappingActivities(activities, range.startMs, range.endMs);
        if (overlaps.length === 0) {
            commitActivity(activity, onCommitted);
            return;
        }
        setOverlapPrompt({ activity, overlaps, onCommitted });
    };

    const handleStart = () => {
        setSession({
            category,
            title,
            startedAt: new Date(),
        });
        setPhase('active');
    };

    const handleSave = () => {
        if (!session) {
            return;
        }
        const endedAt = new Date();
        const durationMin = minutesBetween(session.startedAt, endedAt);
        const activity = createActivity(
            {
                category: session.category,
                title: session.title,
                durationMin,
                mood,
                note,
                startedAt: session.startedAt,
                endedAt,
            },
            categories,
        );
        requestSave(activity, () => {
            setSession(null);
            resetDraft();
            setPhase('idle');
        });
    };

    const handleBackfillSave = () => {
        if (overlapPrompt || backfillRangeError) {
            return;
        }

        const startedAt = combineDateKeyAndTime(backfillDateKey, backfillStartTime);
        const endedAt = combineDateKeyAndTime(backfillDateKey, backfillEndTime);
        const durationMin = minutesBetween(startedAt, endedAt);
        const activity = createActivity(
            {
                category,
                title,
                durationMin,
                mood,
                note,
                startedAt,
                endedAt,
            },
            categories,
        );
        requestSave(activity, () => {
            resetDraft();
            setBackfillDateKey(formatDateKey(new Date()));
            setBackfillStartTime(defaultBackfillStartTime());
            setBackfillEndTime(defaultBackfillEndTime());
        });
    };

    const overlapPromptSection = overlapPrompt ? (
        <OverlapWarning
            overlaps={overlapPrompt.overlaps}
            categories={categories}
            confirmLabel={recordMode === 'backfill' ? '仍要保存补录' : '仍要保存记录'}
            onConfirm={() =>
                commitActivity(overlapPrompt.activity, overlapPrompt.onCommitted)
            }
            onCancel={clearOverlapPrompt}
        />
    ) : null;

    if (phase === 'active' && session) {
        const meta = getCategoryMeta(categories, session.category);
        return (
            <div className="tj-page">
                <header className="tj-page-header">
                    <p className="tj-kicker">记录中</p>
                    <h1>{session.title.trim() || meta.label}</h1>
                    <p className="tj-page-lead">计时进行中，补充心情和备注后保存即可结束本次活动。</p>
                </header>

                <section className="tj-card tj-session-summary">
                    <div className="tj-session-summary-row">
                        <span>活动类型</span>
                        <strong>
                            {meta.emoji} {meta.label}
                        </strong>
                    </div>
                    <div className="tj-session-summary-row">
                        <span>持续时长</span>
                        <strong>{formatElapsed(recordingElapsedMs)}</strong>
                    </div>
                    <div className="tj-session-summary-row">
                        <span>开始时间</span>
                        <strong>{formatTimeLabel(session.startedAt.toISOString())}</strong>
                    </div>
                    <div className="tj-session-summary-row">
                        <span>活动结束</span>
                        <strong className="tj-session-summary-live">保存时确定</strong>
                    </div>
                </section>

                <section className="tj-section">
                    <span className="tj-field-label">心情感受</span>
                    <div className="tj-mood-row">
                        {moodLabels.map((label, index) => {
                            const value = (index + 1) as 1 | 2 | 3 | 4 | 5;
                            return (
                                <button
                                    key={label}
                                    type="button"
                                    className={`tj-mood-btn ${mood === value ? 'tj-mood-btn-active' : ''}`}
                                    onClick={() => setMood(value)}
                                >
                                    <strong>{value}</strong>
                                    <span>{label}</span>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section className="tj-section">
                    <span className="tj-field-label">备注（可选）</span>
                    <RichNoteEditor
                        value={note}
                        onChange={setNote}
                        placeholder="写下这次活动的细节或想法，支持加粗、列表和链接"
                    />
                </section>

                <section className="tj-card tj-preview-card">
                    <span>预计获得</span>
                    <strong>+{previewXp} XP</strong>
                </section>

                {overlapPromptSection}

                {!overlapPrompt ? (
                    <button type="button" className="tj-primary-btn tj-primary-btn-block" onClick={handleSave}>
                        结束并保存记录
                    </button>
                ) : null}
            </div>
        );
    }

    const sharedFields = (
        <>
            <section className="tj-section">
                <h2 className="tj-field-label">活动类型</h2>
                <div className="tj-chip-grid">
                    {categories.map((item) => {
                        const active = category === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                className={`tj-chip ${active ? 'tj-chip-active' : ''}`}
                                onClick={() => setCategory(item.id)}
                            >
                                <span>{item.emoji}</span>
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            </section>

            <section className="tj-section">
                <label className="tj-field">
                    <span className="tj-field-label">活动名称</span>
                    <input
                        className="tj-input"
                        placeholder={`例如：${selectedMeta.label}`}
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                    />
                </label>
            </section>
        </>
    );

    const moodSection = (
        <section className="tj-section">
            <span className="tj-field-label">心情感受</span>
            <div className="tj-mood-row">
                {moodLabels.map((label, index) => {
                    const value = (index + 1) as 1 | 2 | 3 | 4 | 5;
                    return (
                        <button
                            key={label}
                            type="button"
                            className={`tj-mood-btn ${mood === value ? 'tj-mood-btn-active' : ''}`}
                            onClick={() => setMood(value)}
                        >
                            <strong>{value}</strong>
                            <span>{label}</span>
                        </button>
                    );
                })}
            </div>
        </section>
    );

    return (
        <div className="tj-page">
            <header className="tj-page-header">
                <p className="tj-kicker">开始记录</p>
                <h1>{recordMode === 'live' ? '记录一次活动' : '补录过往活动'}</h1>
                <p className="tj-page-lead">
                    {recordMode === 'live'
                        ? '选择活动类型和名称，点击开始后自动计时，保存时一并结束并写入记录。'
                        : '忘记实时记录时，可补填日期和起止时间，把过往活动补进时间轴。'}
                </p>
            </header>

            <div className="tj-record-mode-switch" role="tablist" aria-label="记录方式">
                <button
                    type="button"
                    role="tab"
                    aria-selected={recordMode === 'live'}
                    className={`tj-record-mode-btn${recordMode === 'live' ? ' tj-record-mode-btn-active' : ''}`}
                    onClick={() => {
                        setRecordMode('live');
                        clearOverlapPrompt();
                    }}
                >
                    <Play size={16} />
                    实时记录
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={recordMode === 'backfill'}
                    className={`tj-record-mode-btn${recordMode === 'backfill' ? ' tj-record-mode-btn-active' : ''}`}
                    onClick={() => {
                        setRecordMode('backfill');
                        clearOverlapPrompt();
                    }}
                >
                    <Clock3 size={16} />
                    补录
                </button>
            </div>

            {recordMode === 'live' ? (
                <>
                    {sharedFields}
                    <button type="button" className="tj-primary-btn tj-primary-btn-block" onClick={handleStart}>
                        <Play size={18} />
                        开始记录
                    </button>
                </>
            ) : (
                <>
                    <section className="tj-section">
                        <span className="tj-field-label">活动日期</span>
                        <DatePickerField
                            value={backfillDateKey}
                            max={formatDateKey(new Date())}
                            onChange={(value) => {
                                setBackfillDateKey(value);
                                clearOverlapPrompt();
                            }}
                        />
                    </section>

                    <section className="tj-section">
                        <span className="tj-field-label">起止时间</span>
                        <div className="tj-time-range-row">
                            <label className="tj-field">
                                <span className="tj-field-label">开始</span>
                                <input
                                    type="time"
                                    className="tj-input"
                                    value={backfillStartTime}
                                    onChange={(event) => {
                                        setBackfillStartTime(event.target.value);
                                        clearOverlapPrompt();
                                    }}
                                />
                            </label>
                            <label className="tj-field">
                                <span className="tj-field-label">结束</span>
                                <input
                                    type="time"
                                    className="tj-input"
                                    value={backfillEndTime}
                                    onChange={(event) => {
                                        setBackfillEndTime(event.target.value);
                                        clearOverlapPrompt();
                                    }}
                                />
                            </label>
                        </div>
                        {backfillDurationMin > 0 && !backfillRangeError ? (
                            <p className="tj-record-backfill-summary">
                                时长 {formatDuration(backfillDurationMin)} · 预计 +{previewXp} XP
                            </p>
                        ) : null}
                        {backfillRangeError ? <p className="tj-auth-error">{backfillRangeError}</p> : null}
                        {backfillOverlaps.length > 0 && !overlapPrompt && !backfillRangeError ? (
                            <div className="tj-overlap-hint">
                                <strong>与 {backfillOverlaps.length} 条已有记录重叠</strong>
                                <ul>
                                    {backfillOverlaps.map((item) => (
                                        <li key={item.id}>
                                            {formatActivityTimeRangeLabel(item, categories)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}
                    </section>

                    {sharedFields}
                    {moodSection}

                    <section className="tj-section">
                        <span className="tj-field-label">备注（可选）</span>
                        <RichNoteEditor
                            value={note}
                            onChange={setNote}
                            placeholder="补充这次活动的细节或想法"
                        />
                    </section>

                    {overlapPromptSection}

                    {!overlapPrompt ? (
                        <button
                            type="button"
                            className="tj-primary-btn tj-primary-btn-block"
                            disabled={backfillDurationMin <= 0 || Boolean(backfillRangeError)}
                            onClick={handleBackfillSave}
                        >
                            保存补录
                        </button>
                    ) : null}
                </>
            )}
        </div>
    );
}
