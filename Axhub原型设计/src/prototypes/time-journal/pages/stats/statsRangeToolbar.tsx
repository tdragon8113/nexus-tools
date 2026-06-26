import React, { useEffect, useMemo, useState } from 'react';
import {
    StatsPeriodBounds,
    StatsRangePreset,
    StatsRangeSelection,
    addDays,
    formatDateKey,
    formatStatsRangeLabel,
    normalizeStatsRangeSelection,
} from '../../data';

export const RANGE_PRESET_OPTIONS: Array<{ id: StatsRangePreset; label: string }> = [
    { id: 'today', label: '今天' },
    { id: 'yesterday', label: '昨日' },
    { id: 'week', label: '本周' },
    { id: 'month', label: '本月' },
    { id: '7d', label: '近 7 天' },
    { id: '30d', label: '近 30 天' },
    { id: 'custom', label: '自定义' },
];

type StatsRangeToolbarProps = {
    rangeSelection: StatsRangeSelection;
    bounds: StatsPeriodBounds;
    onChange: (selection: StatsRangeSelection) => void;
};

function buildDefaultCustomRange(now = new Date()): { startKey: string; endKey: string } {
    const endKey = formatDateKey(now);
    const startKey = formatDateKey(addDays(now, -6));
    return { startKey, endKey };
}

export default function StatsRangeToolbar({
    rangeSelection,
    bounds,
    onChange,
}: StatsRangeToolbarProps) {
    const todayKey = formatDateKey(new Date());
    const defaultCustom = useMemo(() => buildDefaultCustomRange(), []);
    const [customStartKey, setCustomStartKey] = useState(
        rangeSelection.customStartKey ?? defaultCustom.startKey,
    );
    const [customEndKey, setCustomEndKey] = useState(
        rangeSelection.customEndKey ?? defaultCustom.endKey,
    );
    const customActive = rangeSelection.preset === 'custom';

    useEffect(() => {
        if (rangeSelection.preset === 'custom') {
            setCustomStartKey(rangeSelection.customStartKey ?? defaultCustom.startKey);
            setCustomEndKey(rangeSelection.customEndKey ?? defaultCustom.endKey);
        }
    }, [
        rangeSelection.customEndKey,
        rangeSelection.customStartKey,
        rangeSelection.preset,
        defaultCustom.endKey,
        defaultCustom.startKey,
    ]);

    const handlePresetClick = (preset: StatsRangePreset) => {
        if (preset === 'custom') {
            const draft = normalizeStatsRangeSelection(
                {
                    preset: 'custom',
                    customStartKey,
                    customEndKey,
                },
                new Date(),
            );
            onChange(draft);
            return;
        }

        onChange({ preset });
    };

    const applyCustomRange = () => {
        onChange(
            normalizeStatsRangeSelection(
                {
                    preset: 'custom',
                    customStartKey,
                    customEndKey,
                },
                new Date(),
            ),
        );
    };

    const comparisonHint =
        bounds.preset === 'custom'
            ? `对比${bounds.previousLabel}`
            : `对比${bounds.previousLabel}`;

    return (
        <section className="tj-stats-range-toolbar" aria-label="统计时间范围">
            <div className="tj-stats-range-chips" role="tablist" aria-label="快捷时间范围">
                {RANGE_PRESET_OPTIONS.map((item) => {
                    const active = rangeSelection.preset === item.id;
                    return (
                        <button
                            key={item.id}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            className={`tj-stats-range-chip${active ? ' tj-stats-range-chip-active' : ''}`}
                            onClick={() => handlePresetClick(item.id)}
                        >
                            {item.label}
                        </button>
                    );
                })}
            </div>

            <div className="tj-stats-range-summary">
                <strong>{bounds.label}</strong>
                <span>
                    共 {bounds.dayCount} 天 · {comparisonHint}
                </span>
            </div>

            {customActive ? (
                <div className="tj-stats-range-custom">
                    <div className="tj-stats-range-custom-grid">
                        <label className="tj-field">
                            <span className="tj-field-label">开始</span>
                            <input
                                className="tj-input"
                                type="date"
                                max={todayKey}
                                value={customStartKey}
                                onChange={(event) => setCustomStartKey(event.target.value)}
                            />
                        </label>
                        <label className="tj-field">
                            <span className="tj-field-label">结束</span>
                            <input
                                className="tj-input"
                                type="date"
                                max={todayKey}
                                min={customStartKey}
                                value={customEndKey}
                                onChange={(event) => setCustomEndKey(event.target.value)}
                            />
                        </label>
                    </div>
                    <div className="tj-stats-range-custom-actions">
                        <span>{formatStatsRangeLabel(customStartKey, customEndKey)}</span>
                        <button type="button" className="tj-primary-btn" onClick={applyCustomRange}>
                            应用
                        </button>
                    </div>
                </div>
            ) : null}
        </section>
    );
}
