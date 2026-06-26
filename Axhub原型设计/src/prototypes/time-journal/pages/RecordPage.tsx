import React, { useEffect, useMemo, useState } from 'react';
import { Play } from 'lucide-react';
import RichNoteEditor from '../components/RichNoteEditor';
import {
    ActiveRecordingSession,
    ActivityCategory,
    ActivityCategoryConfig,
    calculateXp,
    createActivity,
    formatElapsed,
    formatTimeLabel,
    getCategoryMeta,
    minutesBetween,
    moodLabels,
} from '../data';

type RecordPageProps = {
    categories: ActivityCategoryConfig[];
    initialActiveRecording?: ActiveRecordingSession | null;
    onSave: (activity: ReturnType<typeof createActivity>) => void;
    onActiveSessionChange?: (session: ActiveRecordingSession | null) => void;
};

type RecordPhase = 'idle' | 'active';

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

export default function RecordPage({
    categories,
    initialActiveRecording = null,
    onSave,
    onActiveSessionChange,
}: RecordPageProps) {
    const initialState = getInitialRecordState(initialActiveRecording);
    const [phase, setPhase] = useState<RecordPhase>(initialState.phase);
    const [session, setSession] = useState<ActiveSession | null>(initialState.session);
    const [category, setCategory] = useState<ActivityCategory>(
        initialState.session?.category ?? categories[0]?.id ?? 'study',
    );
    const [title, setTitle] = useState(initialState.session?.title ?? '');
    const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5>(4);
    const [note, setNote] = useState('');
    const [nowTick, setNowTick] = useState(() => Date.now());

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

    const previewXp = useMemo(() => {
        if (!session) {
            return 0;
        }
        return calculateXp(categories, session.category, liveDurationMin);
    }, [categories, liveDurationMin, session]);

    const resetDraft = () => {
        setTitle('');
        setNote('');
        setMood(4);
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
        onSave(activity);
        setSession(null);
        resetDraft();
        setPhase('idle');
    };

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

                <button type="button" className="tj-primary-btn tj-primary-btn-block" onClick={handleSave}>
                    结束并保存记录
                </button>
            </div>
        );
    }

    return (
        <div className="tj-page">
            <header className="tj-page-header">
                <p className="tj-kicker">开始记录</p>
                <h1>记录一次活动</h1>
                <p className="tj-page-lead">选择活动类型和名称，点击开始后自动计时，保存时一并结束并写入记录。</p>
            </header>

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

            <button type="button" className="tj-primary-btn tj-primary-btn-block" onClick={handleStart}>
                <Play size={18} />
                开始记录
            </button>
        </div>
    );
}
