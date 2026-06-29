const LEVEL_THRESHOLDS = [0, 80, 180, 320, 500, 720, 980, 1280, 1620, 2000] as const;

export type LevelInfo = {
    level: number;
    currentXp: number;
    nextLevelXp: number;
    progress: number;
};

export function getLevelInfo(totalXp: number): LevelInfo {
    let level = 1;

    for (let index = 0; index < LEVEL_THRESHOLDS.length - 1; index += 1) {
        if (totalXp >= LEVEL_THRESHOLDS[index + 1]) {
            level = index + 2;
        } else {
            break;
        }
    }

    const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
    const nextThreshold =
        level < LEVEL_THRESHOLDS.length
            ? LEVEL_THRESHOLDS[level]
            : LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 400;
    const currentXp = totalXp - currentThreshold;
    const nextLevelXp = nextThreshold - currentThreshold;
    const progress = Math.min(100, Math.round((currentXp / nextLevelXp) * 100));

    return { level, currentXp, nextLevelXp, progress };
}

export function formatLevelProgress(fraction: number): string {
    return `${Math.round(fraction * 100)}%`;
}
