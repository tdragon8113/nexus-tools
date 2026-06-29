import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarClock, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatYearKey } from '../domain/reflections';

type YearPickerFieldProps = {
    value: string;
    onChange: (value: string) => void;
    max?: string;
    min?: string;
};

export default function YearPickerField({
    value,
    onChange,
    max = formatYearKey(new Date()),
    min,
}: YearPickerFieldProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const maxYear = Number(max);
    const minYear = min ? Number(min) : maxYear - 14;
    const [open, setOpen] = useState(false);
    const [viewStartYear, setViewStartYear] = useState(Math.max(minYear, Number(value) - 2));
    const currentYear = formatYearKey(new Date());

    useEffect(() => {
        setViewStartYear(Math.max(minYear, Number(value) - 2));
    }, [minYear, value]);

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

    const years = useMemo(() => {
        const endYear = Math.min(maxYear, viewStartYear + 8);
        const startYear = Math.max(minYear, endYear - 8);
        const result: number[] = [];
        for (let year = startYear; year <= endYear; year += 1) {
            result.push(year);
        }
        return result;
    }, [maxYear, minYear, viewStartYear]);

    const canGoPrev = years[0] > minYear;
    const canGoNext = years[years.length - 1] < maxYear;

    const selectYear = (year: number) => {
        const yearKey = String(year);
        onChange(yearKey);
        setOpen(false);
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
                    <CalendarClock size={18} />
                    <strong>{value} 年</strong>
                </span>
                <ChevronRight size={18} className="tj-date-picker-trigger-chevron" />
            </button>

            {open ? (
                <div className="tj-date-picker-panel" role="dialog" aria-label="选择年份">
                    <div className="tj-date-picker-nav">
                        <button
                            type="button"
                            className="tj-date-picker-nav-btn"
                            aria-label="更早的年份"
                            disabled={!canGoPrev}
                            onClick={() => setViewStartYear((current) => Math.max(minYear, current - 4))}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <strong>
                            {years[0]} – {years[years.length - 1]}
                        </strong>
                        <button
                            type="button"
                            className="tj-date-picker-nav-btn"
                            aria-label="更晚的年份"
                            disabled={!canGoNext}
                            onClick={() =>
                                setViewStartYear((current) => Math.min(maxYear - 8, current + 4))
                            }
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    <div className="tj-period-picker-grid tj-period-picker-grid-years">
                        {years.map((year) => {
                            const yearKey = String(year);
                            const active = yearKey === value;
                            const current = yearKey === currentYear;
                            return (
                                <button
                                    key={yearKey}
                                    type="button"
                                    className={[
                                        'tj-period-picker-option',
                                        active ? 'tj-period-picker-option-selected' : '',
                                        current ? 'tj-period-picker-option-current' : '',
                                    ]
                                        .filter(Boolean)
                                        .join(' ')}
                                    onClick={() => selectYear(year)}
                                >
                                    {year}
                                </button>
                            );
                        })}
                    </div>

                    {value !== currentYear ? (
                        <button
                            type="button"
                            className="tj-date-picker-quick-btn"
                            onClick={() => {
                                onChange(currentYear);
                                setOpen(false);
                            }}
                        >
                            回到今年
                        </button>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
