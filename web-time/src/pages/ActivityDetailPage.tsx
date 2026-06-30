import { useEffect, useState } from 'react';
import RichNoteContent from '../components/RichNoteContent';
import RichNoteEditor from '../components/RichNoteEditor';
import SubpageHeader from '../components/SubpageHeader';
import { hasNoteContent as noteHasContent } from '../domain/noteRichText';
import {
    formatDuration,
    formatTimeLabel,
    getActivityEndAt,
    getActivityStartAt,
    getActivityXp,
    getCategoryMeta,
    moodLabels,
} from '../domain/record';
import type { Activity, ActivityCategoryConfig } from '../domain/types';

type ActivityDetailPageProps = {
    activity: Activity | null;
    categories: ActivityCategoryConfig[];
    onBack: () => void;
    onUpdateNote: (activityId: string, note: string) => void;
};

export default function ActivityDetailPage({
    activity,
    categories,
    onBack,
    onUpdateNote,
}: ActivityDetailPageProps) {
    const [editingNote, setEditingNote] = useState(false);
    const [noteDraft, setNoteDraft] = useState('');
    const [savedHint, setSavedHint] = useState(false);

    useEffect(() => {
        setEditingNote(false);
        setNoteDraft(activity?.note ?? '');
        setSavedHint(false);
    }, [activity?.id, activity?.note]);

    if (!activity) {
        return (
            <div className="tj-page tj-subpage">
                <SubpageHeader title="活动详情" onBack={onBack} />
                <div className="tj-empty-card">未找到这条活动记录。</div>
            </div>
        );
    }

    const meta = getCategoryMeta(categories, activity.category);
    const startAt = getActivityStartAt(activity);
    const endAt = getActivityEndAt(activity);
    const activityXp = getActivityXp(activity, categories);
    const moodLabel = moodLabels[activity.mood - 1] ?? '未知';
    const hasNote = noteHasContent(activity.note);

    const handleSaveNote = () => {
        onUpdateNote(activity.id, noteDraft);
        setEditingNote(false);
        setSavedHint(true);
        window.setTimeout(() => setSavedHint(false), 1800);
    };

    return (
        <div className="tj-page tj-subpage">
            <SubpageHeader title="活动详情" onBack={onBack} />

            <section className="tj-card tj-activity-detail-hero">
                <div className="tj-activity-detail-icon">{meta.emoji}</div>
                <div>
                    <h2>{activity.title}</h2>
                    <p>{meta.label}</p>
                </div>
                <strong className="tj-activity-detail-xp">+{activityXp} XP</strong>
            </section>

            <section className="tj-card tj-session-summary">
                <div className="tj-session-summary-row">
                    <span>开始时间</span>
                    <strong>{formatTimeLabel(startAt)}</strong>
                </div>
                <div className="tj-session-summary-row">
                    <span>结束时间</span>
                    <strong>{formatTimeLabel(endAt)}</strong>
                </div>
                <div className="tj-session-summary-row">
                    <span>持续时长</span>
                    <strong>{formatDuration(activity.durationMin)}</strong>
                </div>
                <div className="tj-session-summary-row">
                    <span>心情感受</span>
                    <strong>
                        {activity.mood} · {moodLabel}
                    </strong>
                </div>
            </section>

            <section className="tj-section">
                <div className="tj-section-head">
                    <h2 className="tj-field-label">备注</h2>
                    {!editingNote ? (
                        <button type="button" className="tj-text-btn" onClick={() => setEditingNote(true)}>
                            {hasNote ? '编辑' : '添加'}
                        </button>
                    ) : null}
                </div>

                {editingNote ? (
                    <div className="tj-card tj-note-editor">
                        <RichNoteEditor
                            value={noteDraft}
                            onChange={setNoteDraft}
                            placeholder="写下这次活动的细节或想法，支持加粗、列表和链接"
                        />
                        <div className="tj-note-editor-actions">
                            <button
                                type="button"
                                className="tj-secondary-btn"
                                onClick={() => {
                                    setNoteDraft(activity.note ?? '');
                                    setEditingNote(false);
                                }}
                            >
                                取消
                            </button>
                            <button type="button" className="tj-primary-btn" onClick={handleSaveNote}>
                                保存备注
                            </button>
                        </div>
                    </div>
                ) : (
                    <article className={`tj-card tj-reflection-card ${hasNote ? '' : 'tj-note-empty'}`}>
                        <RichNoteContent
                            html={activity.note}
                            emptyText="暂无备注，可点击右上角添加"
                        />
                    </article>
                )}

                {savedHint ? <p className="tj-category-message">备注已保存</p> : null}
            </section>
        </div>
    );
}
