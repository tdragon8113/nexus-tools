/** 计算器记录保留时长（小时）；需调整请改此常量并重新构建 */
export const CALCULATOR_TAPE_RETENTION_HOURS = 12

export function entryWithinRetention(
  entry: { createdAt: number },
  retentionHours: number = CALCULATOR_TAPE_RETENTION_HOURS,
  now = Date.now()
): boolean {
  const maxAgeMs = retentionHours * 60 * 60 * 1000
  return now - entry.createdAt <= maxAgeMs
}

export function filterEntriesWithinRetention<T extends { createdAt: number }>(
  entries: T[],
  retentionHours: number = CALCULATOR_TAPE_RETENTION_HOURS,
  now = Date.now()
): T[] {
  return entries.filter((entry) => entryWithinRetention(entry, retentionHours, now))
}
