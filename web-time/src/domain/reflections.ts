import { addDays, formatArchiveDateLabel, formatDateKey } from './record';
import type { Reflection, ReflectionScope } from './types';

export function getReflectionScope(reflection: Reflection): ReflectionScope {
    return reflection.scope ?? 'day';
}

export function formatMonthKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

export function formatYearKey(date: Date): string {
    return String(date.getFullYear());
}

export function filterReflectionsByScope(
    reflections: Reflection[],
    scope: ReflectionScope,
): Reflection[] {
    return reflections.filter((item) => getReflectionScope(item) === scope);
}

export function getReflectionsSortedDesc(
    reflections: Reflection[],
    scope?: ReflectionScope,
): Reflection[] {
    const list = scope ? filterReflectionsByScope(reflections, scope) : reflections;
    return [...list].sort((a, b) => b.date.localeCompare(a.date));
}

export function formatReflectionPeriodLabel(reflection: Reflection, now = new Date()): string {
    const scope = getReflectionScope(reflection);
    if (scope === 'year') {
        return `${reflection.date} 年`;
    }
    if (scope === 'month') {
        const [year, month] = reflection.date.split('-');
        return `${year} 年 ${Number(month)} 月`;
    }
    return formatArchiveDateLabel(reflection.date, now);
}

export function getReflectionScopeLabel(scope: ReflectionScope): string {
    if (scope === 'month') {
        return '月总结';
    }
    if (scope === 'year') {
        return '年总结';
    }
    return '日感悟';
}

export { addDays, formatDateKey };
