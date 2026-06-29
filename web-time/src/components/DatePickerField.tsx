import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatArchiveDateLabel, formatDateKey } from '../domain/record';

type DatePickerFieldProps = {
    value: string;
    onChange: (value: string) => void;
    max?: string;
    min?: string;
};

type CalendarCell = {
    dateKey: string;
    day: number;
    inMonth: boolean;
};

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

function parseDateKey(dateKey: string) {
    const [year, month, day] = dateKey.split('-').map(Number);
    return { year, month, day };
}

function formatPickerSummary(dateKey: string, now = new Date()) {
    const { year, month, day } = parseDateKey(dateKey);
    const weekdayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdayLabels[new Date(year, month - 1, day).getDay()];
    const relative = formatArchiveDateLabel(dateKey, now);
    if (relative === '今天' || relative === '昨天') {
        return `${relative} · ${month}月${day}日 · ${weekday}`;
    }
    return `${month}月${day}日 · ${weekday}`;
}

function buildCalendarCells(viewYear: number, viewMonth: number): CalendarCell[] {
    const firstWeekday = new Date(viewYear, viewMonth - 1, 1).getDay();
    const mondayOffset = firstWeekday === 0 ? 6 : firstWeekday - 1;
    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth - 1, 0).getDate();
    const cells: CalendarCell[] = [];

    for (let index = 0; index < 42; index += 1) {
        const dayIndex = index - mondayOffset + 1;
        let year = viewYear;
        let month = viewMonth;
        let day = dayIndex;
        let inMonth = true;

        if (dayIndex <= 0) {
            month = viewMonth === 1 ? 12 : viewMonth - 1;
            year = viewMonth === 1 ? viewYear - 1 : viewYear;
            day = daysInPrevMonth + dayIndex;
            inMonth = false;
        } else if (dayIndex > daysInMonth) {
            month = viewMonth === 12 ? 1 : viewMonth + 1;
            year = viewMonth === 12 ? viewYear + 1 : viewYear;
            day = dayIndex - daysInMonth;
            inMonth = false;
        }

        cells.push({
            dateKey: formatDateKey(new Date(year, month - 1, day)),
            day,
            inMonth,
        });
    }

    return cells;
}

export default function DatePickerField({
    value,
    onChange,
    max = formatDateKey(new Date()),
    min,
}: DatePickerFieldProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const selected = parseDateKey(value);
    const [open, setOpen] = useState(false);
    const [viewYear, setViewYear] = useState(selected.year);
    const [viewMonth, setViewMonth] = useState(selected.month);
    const todayKey = formatDateKey(new Date());

    useEffect(() => {
        setViewYear(selected.year);
        setViewMonth(selected.month);
    }, [selected.month, selected.year]);

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

    const cells = useMemo(
        () => buildCalendarCells(viewYear, viewMonth),
        [viewMonth, viewYear],
    );

    const maxParts = parseDateKey(max);
    const minParts = min ? parseDateKey(min) : null;

    const canGoNext =
        viewYear < maxParts.year
        || (viewYear === maxParts.year && viewMonth < maxParts.month);

    const canGoPrev = minParts
        ? viewYear > minParts.year
            || (viewYear === minParts.year && viewMonth > minParts.month)
        : true;

    const shiftMonth = (delta: number) => {
        const cursor = new Date(viewYear, viewMonth - 1 + delta, 1);
        setViewYear(cursor.getFullYear());
        setViewMonth(cursor.getMonth() + 1);
    };

    const isDisabled = (dateKey: string) => {
        if (dateKey > max) {
            return true;
        }
        if (min && dateKey < min) {
            return true;
        }
        return false;
    };

    const selectDate = (dateKey: string) => {
        onChange(dateKey);
        const next = parseDateKey(dateKey);
        setViewYear(next.year);
        setViewMonth(next.month);
        setOpen(false);
    };

    const jumpToToday = () => {
        selectDate(todayKey);
    };

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
                    <CalendarDays size={18} />
                    <strong>{formatPickerSummary(value)}</strong>
                </span>
                <ChevronRight size={18} className="tj-date-picker-trigger-chevron" />
            </button>

            {open ? (
                <div className="tj-date-picker-panel" role="dialog" aria-label="选择日期">
                    <div className="tj-date-picker-nav">
                        <button
                            type="button"
                            className="tj-date-picker-nav-btn"
                            aria-label="上个月"
                            disabled={!canGoPrev}
                            onClick={() => shiftMonth(-1)}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <strong>
                            {viewYear}年{viewMonth}月
                        </strong>
                        <button
                            type="button"
                            className="tj-date-picker-nav-btn"
                            aria-label="下个月"
                            disabled={!canGoNext}
                            onClick={() => shiftMonth(1)}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    <div className="tj-date-picker-weekdays" aria-hidden>
                        {WEEKDAY_LABELS.map((label) => (
                            <span key={label}>{label}</span>
                        ))}
                    </div>

                    <div className="tj-date-picker-grid" role="grid" aria-label="日期列表">
                        {cells.map((cell) => {
                            const selectedDay = cell.dateKey === value;
                            const today = cell.dateKey === todayKey;
                            const disabled = isDisabled(cell.dateKey);
                            return (
                                <button
                                    key={`${cell.dateKey}-${cell.inMonth ? 'in' : 'out'}`}
                                    type="button"
                                    role="gridcell"
                                    className={[
                                        'tj-date-picker-day',
                                        !cell.inMonth ? 'tj-date-picker-day-outside' : '',
                                        selectedDay ? 'tj-date-picker-day-selected' : '',
                                        today ? 'tj-date-picker-day-today' : '',
                                    ]
                                        .filter(Boolean)
                                        .join(' ')}
                                    disabled={disabled}
                                    aria-pressed={selectedDay}
                                    aria-label={cell.dateKey}
                                    onClick={() => selectDate(cell.dateKey)}
                                >
                                    {cell.day}
                                </button>
                            );
                        })}
                    </div>

                    {value !== todayKey ? (
                        <button
                            type="button"
                            className="tj-date-picker-quick-btn"
                            onClick={jumpToToday}
                        >
                            回到今天
                        </button>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
