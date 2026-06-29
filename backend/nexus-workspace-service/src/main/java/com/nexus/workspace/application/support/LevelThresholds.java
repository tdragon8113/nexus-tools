package com.nexus.workspace.application.support;

/**
 * Level XP thresholds ported from time-journal prototype {@code data.ts#getLevelInfo}.
 */
public final class LevelThresholds {

    private static final int[] THRESHOLDS = {0, 80, 180, 320, 500, 720, 980, 1280, 1620, 2000};

    private LevelThresholds() {}

    public record LevelInfo(int level, double levelProgress) {}

    public static LevelInfo getLevelInfo(int totalXp) {
        int level = 1;
        for (int index = 0; index < THRESHOLDS.length - 1; index++) {
            if (totalXp >= THRESHOLDS[index + 1]) {
                level = index + 2;
            } else {
                break;
            }
        }

        int currentThreshold = THRESHOLDS[level - 1];
        int nextThreshold = level < THRESHOLDS.length
            ? THRESHOLDS[level]
            : THRESHOLDS[THRESHOLDS.length - 1] + 400;
        int currentXp = totalXp - currentThreshold;
        int nextLevelXp = nextThreshold - currentThreshold;
        double progress = nextLevelXp > 0
            ? Math.min(1.0, (double) currentXp / nextLevelXp)
            : 1.0;

        return new LevelInfo(level, progress);
    }
}
