import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatMonthKey } from '../domain/reflections';

type MonthPickerFieldProps = {
    value: string;
    onChange: (value: string) => void;
    max?: string;
    min?: string;
};

const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

function parseMonthKey(monthKey: string) {
    const [year, month] = monthKey.split('-').map(Number);
    return { year, month };
}

function formatMonthSummary(monthKey: string) {
    const { year, month } = parseMonthKey(monthKey);
    return `${year} 年 ${month} 月`;
}

export default function MonthPickerField({
    value,
    onChange,
    max = formatMonthKey(new Date()),
    min,
}: MonthPickerFieldProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const selected = parseMonthKey(value);
    const maxParts = parseMonthKey(max);
    const minParts = min ? parseMonthKey(min) : null;
    const [open, setOpen] = useState(false);
    const [viewYear, setViewYear] = useState(selected.year);
    const currentMonthKey = formatMonthKey(new Date());

    useEffect(() => {
        setViewYear(selected.year);
    }, [selected.year]);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const handlePointerDown = (event: MouseEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        return () => document.removeEventListener('mousedown', handlePointerDown);
    }, [open]);

    const canGoNext = viewYear < maxParts.year;
    const canGoPrev = minParts ? viewYear > minParts.year : viewYear > maxParts.year - 15;

    const isDisabled = (month: number) => {
        const monthKey = `${viewYear}-${String(month).padStart(2, '0')}`;
        if (monthKey > max) {
            return true;
        }
        if (min && monthKey < min) {
            return true;
        }
        return false;
    };

    const selectMonth = (month: number) => {
        const monthKey = `${viewYear}-${String(month).padStart(2, '0')}`;
        if (isDisabled(month)) {
            return;
        }
        onChange(monthKey);
        setOpen(false);
    };

    const months = useMemo(() => Array.from({ length: 12 }, (_, index) => index + 1), []);

    return (
        <div ref={rootRef} className={`tj-date-picker${open ? ' tj-date-picker-open' : ''}`}>
            <button
                type="button"
                className="tj-date-picker-trigger"
                aria-expanded={open}
                aria-haspopup="dialog"
                onClick={() => setOpen((current) => !current)}
            >
                <span className="tj-date-picker-trigger-leading">
                    <CalendarRange size={18} />
                    <strong>{formatMonthSummary(value)}</strong>
                </span>
                <ChevronRight size={18} className="tj-date-picker-trigger-chevron" />
            </button>

            {open ? (
                <div className="tj-date-picker-panel" role="dialog" aria-label="选择月份">
                    <div className="tj-date-picker-nav">
                        <button
                            type="button"
                            className="tj-date-picker-nav-btn"
                            aria-label="上一年"
                            disabled={!canGoPrev}
                            onClick={() => setViewYear((current) => current - 1)}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <strong>{viewYear} 年</strong>
                        <button
                            type="button"
                            className="tj-date-picker-nav-btn"
                            aria-label="下一年"
                            disabled={!canGoNext}
                            onClick={() => setViewYear((current) => current + 1)}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    <div className="tj-period-picker-grid tj-period-picker-grid-months">
                        {months.map((month) => {
                            const monthKey = `${viewYear}-${String(month).padStart(2, '0')}`;
                            const active = monthKey === value;
                            const current = monthKey === currentMonthKey;
                            return (
                                <button
                                    key={monthKey}
                                    type="button"
                                    className={[
                                        'tj-period-picker-option',
                                        active ? 'tj-period-picker-option-selected' : '',
                                        current ? 'tj-period-picker-option-current' : '',
                                    ]
                                        .filter(Boolean)
                                        .join(' ')}
                                    disabled={isDisabled(month)}
                                    onClick={() => selectMonth(month)}
                                >
                                    {MONTH_LABELS[month - 1]}
                                </button>
                            );
                        })}
                    </div>

                    {value !== currentMonthKey ? (
                        <button
                            type="button"
                            className="tj-date-picker-quick-btn"
                            onClick={() => {
                                onChange(currentMonthKey);
                                setViewYear(parseMonthKey(currentMonthKey).year);
                                setOpen(false);
                            }}
                        >
                            回到本月
                        </button>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
