import type { Activity, ActivityCategory, ActivityCategoryConfig } from './types';

export function createCategoryId(
    label: string,
    categories: ActivityCategoryConfig[],
): string {
    const slug = label
        .trim()
        .toLowerCase()
        .replace(/[^\w]+/g, '-')
        .replace(/^-|-$/g, '');
    const base = slug || `cat-${Date.now()}`;
    if (!categories.some((item) => item.id === base)) {
        return base;
    }
    let index = 2;
    while (categories.some((item) => item.id === `${base}-${index}`)) {
        index += 1;
    }
    return `${base}-${index}`;
}

export function countActivitiesByCategory(
    activities: Activity[],
    categoryId: ActivityCategory,
): number {
    return activities.filter((item) => item.category === categoryId).length;
}
