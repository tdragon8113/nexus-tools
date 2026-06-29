import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DailyOverviewList from '../../components/DailyOverviewList';
import DatePickerField from '../../components/DatePickerField';
import MonthPickerField from '../../components/MonthPickerField';
import YearPickerField from '../../components/YearPickerField';
import RichNoteContent from '../../components/RichNoteContent';
import RichNoteEditor from '../../components/RichNoteEditor';
import { getActivityAttributionDateKey, getActivitiesSortedDesc } from '../../domain/dates';
import { hasNoteContent } from '../../domain/noteRichText';
import {
    formatArchiveDateLabel,
    formatDuration,
    formatTimeLabel,
    getActivityStartAt,
    getCategoryMeta,
} from '../../domain/record';
import {
    formatDateKey,
    formatMonthKey,
    formatReflectionPeriodLabel,
    formatYearKey,
    getReflectionsSortedDesc,
} from '../../domain/reflections';
import { getRecordDailyTracks } from '../../domain/stats';
import type { Reflection, ReflectionScope } from '../../domain/types';
import { useTimeJournal } from '../../hooks/TimeJournalProvider';

export type ProfileArchiveKind =
    | 'record-days'
    | 'activities'
    | 'reflections'
    | 'month-summaries'
    | 'year-summaries';

const pageCopy: Record<
    ProfileArchiveKind,
    { title: string; lead: string; empty: string; newLabel: string }
> = {
    'record-days': {
        title: '记录天',
        lead: '按日期倒序查看，点某天可展开时间轴。',
        empty: '还没有记录天，先去记录一条活动吧。',
        newLabel: '',
    },
    activities: {
        title: '全部活动',
        lead: '按时间倒序查看所有活动记录。',
        empty: '还没有活动记录，点击底部「记录」开始吧。',
        newLabel: '',
    },
    reflections: {
        title: '全部感悟',
        lead: '按日期倒序查看，可编辑或新增指定日期的感悟。',
        empty: '还没有感悟，点右上角「新增」写一条吧。',
        newLabel: '新增感悟',
    },
    'month-summaries': {
        title: '月总结',
        lead: '回顾每个月的收获与变化，可编辑或新增指定月份。',
        empty: '还没有月总结，点右上角「新增」写一条吧。',
        newLabel: '新增月总结',
    },
    'year-summaries': {
        title: '年总结',
        lead: '记录整年的成长与方向，可编辑或新增指定年份。',
        empty: '还没有年总结，点右上角「新增」写一条吧。',
        newLabel: '新增年总结',
    },
};

const summaryKindConfig: Record<
    'reflections' | 'month-summaries' | 'year-summaries',
    {
        scope: ReflectionScope;
        periodLabel: string;
        placeholder: string;
        duplicateHint: string;
        defaultPeriod: () => string;
        maxPeriod: () => string;
    }
> = {
    reflections: {
        scope: 'day',
        periodLabel: '日期',
        placeholder: '记录这一天的感受与收获……',
        duplicateHint: '该日期已有感悟，保存将更新内容。',
        defaultPeriod: () => formatDateKey(new Date()),
        maxPeriod: () => formatDateKey(new Date()),
    },
    'month-summaries': {
        scope: 'month',
        periodLabel: '月份',
        placeholder: '回顾这个月的重点、变化与下一步……',
        duplicateHint: '该月份已有总结，保存将更新内容。',
        defaultPeriod: () => formatMonthKey(new Date()),
        maxPeriod: () => formatMonthKey(new Date()),
    },
    'year-summaries': {
        scope: 'year',
        periodLabel: '年份',
        placeholder: '总结这一年的成长、收获与新目标……',
        duplicateHint: '该年份已有总结，保存将更新内容。',
        defaultPeriod: () => formatYearKey(new Date()),
        maxPeriod: () => formatYearKey(new Date()),
    },
};

type SummaryEditorMode = 'closed' | 'new' | string;

function isSummaryKind(
    kind: ProfileArchiveKind,
): kind is 'reflections' | 'month-summaries' | 'year-summaries' {
    return kind === 'reflections' || kind === 'month-summaries' || kind === 'year-summaries';
}

function PeriodPicker({
    scope,
    value,
    max,
    onChange,
}: {
    scope: ReflectionScope;
    value: string;
    max: string;
    onChange: (value: string) => void;
}) {
    if (scope === 'month') {
        return <MonthPickerField value={value} max={max} onChange={onChange} />;
    }
    if (scope === 'year') {
        return <YearPickerField value={value} max={max} onChange={onChange} />;
    }
    return <DatePickerField value={value} max={max} onChange={onChange} />;
}

function SummaryEditor({
    scope,
    period,
    content,
    periodEditable,
    duplicateHint,
    config,
    onPeriodChange,
    onContentChange,
    onCancel,
    onSave,
}: {
    scope: ReflectionScope;
    period: string;
    content: string;
    periodEditable: boolean;
    duplicateHint?: boolean;
    config: (typeof summaryKindConfig)['reflections'];
    onPeriodChange: (period: string) => void;
    onContentChange: (content: string) => void;
    onCancel: () => void;
    onSave: () => void;
}) {
    return (
        <article className="tj-card tj-reflection-editor">
            {periodEditable ? (
                <div className="tj-field">
                    <span className="tj-field-label">{config.periodLabel}</span>
                    <PeriodPicker
                        scope={scope}
                        value={period}
                        max={config.maxPeriod()}
                        onChange={onPeriodChange}
                    />
                    {duplicateHint ? (
                        <span className="tj-reflection-date-hint">{config.duplicateHint}</span>
                    ) : null}
                </div>
            ) : (
                <span className="tj-archive-reflection-date">
                    {scope === 'day'
                        ? formatArchiveDateLabel(period)
                        : formatReflectionPeriodLabel({ id: '', scope, date: period, content: '' })}
                </span>
            )}
            <RichNoteEditor
                value={content}
                onChange={onContentChange}
                placeholder={config.placeholder}
            />
            <div className="tj-reflection-editor-actions">
                <button type="button" className="tj-secondary-btn" onClick={onCancel}>
                    取消
                </button>
                <button
                    type="button"
                    className="tj-primary-btn"
                    onClick={onSave}
                    disabled={!hasNoteContent(content) || !period}
                >
                    保存
                </button>
            </div>
        </article>
    );
}

type ProfileArchivePageProps = {
    kind: ProfileArchiveKind;
};

export default function ProfileArchivePage({ kind }: ProfileArchivePageProps) {
    const navigate = useNavigate();
    const { activities, categories, reflections, upsertReflection } = useTimeJournal();

    const copy = pageCopy[kind];
    const summaryKind = isSummaryKind(kind) ? kind : null;
    const summaryConfig = summaryKind ? summaryKindConfig[summaryKind] : null;
    const [editorMode, setEditorMode] = useState<SummaryEditorMode>('closed');
    const [draftPeriod, setDraftPeriod] = useState(formatDateKey(new Date()));
    const [draftContent, setDraftContent] = useState('');

    const recordDayTracks = useMemo(
        () => getRecordDailyTracks(activities, categories),
        [activities, categories],
    );
    const sortedActivities = useMemo(() => getActivitiesSortedDesc(activities), [activities]);
    const sortedSummaries = useMemo(
        () =>
            summaryConfig
                ? getReflectionsSortedDesc(reflections, summaryConfig.scope)
                : [],
        [reflections, summaryConfig],
    );

    const isSummaryEditing = summaryKind !== null && editorMode !== 'closed';
    const duplicatePeriod =
        editorMode === 'new' && sortedSummaries.some((item) => item.date === draftPeriod);

    const closeEditor = () => {
        setEditorMode('closed');
        setDraftContent('');
        if (summaryConfig) {
            setDraftPeriod(summaryConfig.defaultPeriod());
        }
    };

    const startNewSummary = () => {
        if (!summaryConfig) {
            return;
        }
        setEditorMode('new');
        setDraftPeriod(summaryConfig.defaultPeriod());
        setDraftContent('');
    };

    const startEditSummary = (item: Reflection) => {
        setEditorMode(item.id);
        setDraftPeriod(item.date);
        setDraftContent(item.content);
    };

    const saveSummary = () => {
        if (!summaryConfig || !hasNoteContent(draftContent) || !draftPeriod) {
            return;
        }
        void upsertReflection({
            scope: summaryConfig.scope,
            periodKey: draftPeriod,
            content: draftContent,
        }).then(() => closeEditor());
    };

    const subpageClassName = [
        'tj-page',
        'tj-subpage',
        kind === 'record-days' ? 'tj-subpage-record-days' : '',
        summaryKind ? 'tj-subpage-reflections' : '',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={subpageClassName}>
            <header className="tj-subpage-sticky-head">
                <button type="button" className="tj-back-btn" onClick={() => navigate('/profile')}>
                    <ChevronLeft size={18} />
                    返回
                </button>
                {kind === 'record-days' ? (
                    <div className="tj-subpage-title-row">
                        <h1>{copy.title}</h1>
                        <span>点某天展开时间轴</span>
                    </div>
                ) : summaryKind ? (
                    <div className="tj-subpage-title-row">
                        <h1>{copy.title}</h1>
                        {!isSummaryEditing ? (
                            <button type="button" className="tj-text-btn" onClick={startNewSummary}>
                                新增
                            </button>
                        ) : null}
                    </div>
                ) : (
                    <>
                        <h1>{copy.title}</h1>
                        <p className="tj-page-lead">{copy.lead}</p>
                    </>
                )}
            </header>

            {kind === 'record-days' ? (
                <DailyOverviewList
                    dailyTracks={recordDayTracks}
                    categories={categories}
                    onOpenActivity={(activityId) => navigate(`/activity/${activityId}`)}
                    emptyText={copy.empty}
                />
            ) : null}

            {kind === 'activities' ? (
                sortedActivities.length > 0 ? (
                    <div className="tj-archive-list">
                        {sortedActivities.map((item) => {
                            const meta = getCategoryMeta(categories, item.category);
                            const startAt = getActivityStartAt(item);
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    className="tj-card tj-archive-activity-row"
                                    onClick={() => navigate(`/activity/${item.id}`)}
                                >
                                    <span className="tj-archive-activity-emoji">{meta.emoji}</span>
                                    <div className="tj-archive-activity-copy">
                                        <strong>{item.title}</strong>
                                        <p>
                                            {formatArchiveDateLabel(
                                                getActivityAttributionDateKey(item, categories),
                                            )}{' '}
                                            · {formatTimeLabel(startAt)} · {meta.label} ·{' '}
                                            {formatDuration(item.durationMin)}
                                        </p>
                                    </div>
                                    <ChevronRight size={16} />
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="tj-empty-card">{copy.empty}</div>
                )
            ) : null}

            {summaryKind && summaryConfig ? (
                <>
                    {editorMode === 'new' ? (
                        <SummaryEditor
                            scope={summaryConfig.scope}
                            period={draftPeriod}
                            content={draftContent}
                            periodEditable
                            duplicateHint={duplicatePeriod}
                            config={summaryConfig}
                            onPeriodChange={setDraftPeriod}
                            onContentChange={setDraftContent}
                            onCancel={closeEditor}
                            onSave={saveSummary}
                        />
                    ) : null}

                    {sortedSummaries.length > 0 ? (
                        <div className="tj-archive-list">
                            {sortedSummaries.map((item) =>
                                editorMode === item.id ? (
                                    <SummaryEditor
                                        key={item.id}
                                        scope={summaryConfig.scope}
                                        period={item.date}
                                        content={draftContent}
                                        periodEditable={false}
                                        config={summaryConfig}
                                        onPeriodChange={setDraftPeriod}
                                        onContentChange={setDraftContent}
                                        onCancel={closeEditor}
                                        onSave={saveSummary}
                                    />
                                ) : (
                                    <article
                                        key={item.id}
                                        className="tj-card tj-archive-reflection-card"
                                    >
                                        <div className="tj-archive-reflection-head">
                                            <span className="tj-archive-reflection-date">
                                                {formatReflectionPeriodLabel(item)}
                                            </span>
                                            {editorMode === 'closed' ? (
                                                <button
                                                    type="button"
                                                    className="tj-text-btn"
                                                    onClick={() => startEditSummary(item)}
                                                >
                                                    编辑
                                                </button>
                                            ) : null}
                                        </div>
                                        <RichNoteContent html={item.content} />
                                    </article>
                                ),
                            )}
                        </div>
                    ) : editorMode !== 'new' ? (
                        <div className="tj-empty-card">
                            <p>{copy.empty}</p>
                            <button
                                type="button"
                                className="tj-primary-btn tj-empty-card-action"
                                onClick={startNewSummary}
                            >
                                {copy.newLabel}
                            </button>
                        </div>
                    ) : null}
                </>
            ) : null}
        </div>
    );
}
