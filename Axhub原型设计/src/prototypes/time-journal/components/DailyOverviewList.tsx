import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import {
    ActivityCategoryConfig,
    StatsDailyTrack,
    formatDuration,
    formatTimeLabel,
    getActivityStartAt,
    getCategoryMeta,
} from '../data';

const TIMELINE_DIMMED_SEGMENT_COLOR = '#c4cad2';

type DailyOverviewListProps = {
    dailyTracks: StatsDailyTrack[];
    categories: ActivityCategoryConfig[];
    focusedCategoryId?: string | null;
    onOpenActivity?: (activityId: string) => void;
    emptyText?: string;
};

export default function DailyOverviewList({
    dailyTracks,
    categories,
    focusedCategoryId = null,
    onOpenActivity,
    emptyText = '还没有可查看的记录天。',
}: DailyOverviewListProps) {
    const [expandedDateKey, setExpandedDateKey] = useState<string | null>(null);

    const handleToggleDay = (dateKey: string, hasRecord: boolean) => {
        if (!hasRecord) {
            return;
        }
        setExpandedDateKey((current) => (current === dateKey ? null : dateKey));
    };

    if (dailyTracks.length === 0) {
        return <div className="tj-empty-card">{emptyText}</div>;
    }

    return (
        <div className="tj-stats-day-list">
            {dailyTracks.map((day) => {
                const expanded = expandedDateKey === day.dateKey;
                const segments = day.segments.map((segment) => {
                    const dimmed = Boolean(
                        focusedCategoryId && segment.category !== focusedCategoryId,
                    );
                    return {
                        ...segment,
                        displayColor: dimmed ? TIMELINE_DIMMED_SEGMENT_COLOR : segment.color,
                    };
                });

                return (
                    <article
                        key={day.dateKey}
                        className={`tj-card tj-stats-day-card${expanded ? ' tj-stats-day-card-expanded' : ''}${!day.hasRecord ? ' tj-stats-day-card-empty' : ''}`}
                    >
                        <button
                            type="button"
                            className="tj-stats-day-head"
                            onClick={() => handleToggleDay(day.dateKey, day.hasRecord)}
                            disabled={!day.hasRecord}
                        >
                            <div>
                                <strong>
                                    {day.subLabel} · 周{day.weekday}
                                </strong>
                                <span>
                                    {day.hasRecord
                                        ? `${day.activities.length} 条 · ${formatDuration(day.minutes)}`
                                        : '无记录'}
                                </span>
                            </div>
                            {day.hasRecord ? (
                                <ChevronRight
                                    size={18}
                                    className={expanded ? 'tj-stats-day-chevron-open' : ''}
                                />
                            ) : null}
                        </button>

                        {day.hasRecord && day.segments.length > 0 ? (
                            <div className="tj-activity-day-track-wrap tj-stats-day-track-wrap">
                                <div className="tj-activity-day-track">
                                    {segments.map((segment) => (
                                        <span
                                            key={segment.id}
                                            className="tj-activity-day-segment"
                                            style={{
                                                left: `${segment.left}%`,
                                                width: `${segment.width}%`,
                                                background: segment.displayColor,
                                            }}
                                            title={segment.title}
                                        />
                                    ))}
                                </div>
                                <div className="tj-activity-day-axis">
                                    <span>{day.axisStart}</span>
                                    <span>{day.axisMid}</span>
                                    <span>{day.axisEnd}</span>
                                </div>
                            </div>
                        ) : null}

                        {expanded && day.activities.length > 0 ? (
                            <div className="tj-activity-timeline tj-stats-day-timeline">
                                {[...day.activities].reverse().map((activity, index) => {
                                    const meta = getCategoryMeta(categories, activity.category);
                                    const isLast = index === day.activities.length - 1;
                                    const dimmed = Boolean(
                                        focusedCategoryId &&
                                            activity.category !== focusedCategoryId,
                                    );
                                    return (
                                        <button
                                            key={activity.id}
                                            type="button"
                                            className={`tj-timeline-activity-row${dimmed ? ' tj-timeline-activity-row-is-dimmed' : ''}`}
                                            onClick={() => onOpenActivity?.(activity.id)}
                                            disabled={!onOpenActivity}
                                        >
                                            <div className="tj-timeline-leading">
                                                <div className="tj-timeline-time-range">
                                                    <span className="tj-timeline-time-start">
                                                        {formatTimeLabel(
                                                            getActivityStartAt(activity),
                                                        )}
                                                    </span>
                                                    <span className="tj-timeline-time-sep">–</span>
                                                    <span className="tj-timeline-time-end">
                                                        {formatTimeLabel(activity.createdAt)}
                                                    </span>
                                                </div>
                                                <div className="tj-timeline-rail">
                                                    <span className="tj-timeline-dot" />
                                                    {!isLast ? (
                                                        <span className="tj-timeline-line" />
                                                    ) : null}
                                                </div>
                                            </div>
                                            <article className="tj-timeline-card">
                                                <span className="tj-timeline-emoji">{meta.emoji}</span>
                                                <div className="tj-timeline-copy">
                                                    <strong>{activity.title}</strong>
                                                    <p>
                                                        {meta.label} ·{' '}
                                                        {formatDuration(activity.durationMin)}
                                                    </p>
                                                </div>
                                                <ChevronRight
                                                    size={16}
                                                    className="tj-timeline-chevron"
                                                />
                                            </article>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : null}
                    </article>
                );
            })}
        </div>
    );
}
