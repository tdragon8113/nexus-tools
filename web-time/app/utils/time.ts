export function pad2 (n: number) {
  return String(n).padStart(2, '0')
}

export function formatDuration (totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${pad2(m)}:${pad2(s)}`
}

export function formatMinutes (minutes: number) {
  if (minutes < 60) return `${minutes} 分钟`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h} 小时 ${m} 分钟` : `${h} 小时`
}

export function toLocalIso (date: Date) {
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60_000)
  return local.toISOString().slice(0, 19)
}

export function isToday (iso: string) {
  const d = new Date(iso)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate()
  )
}

export function formatTimeOfDay (iso: string) {
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T'))
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

export function parseLocalIso (iso: string) {
  return new Date(iso.includes('T') ? iso : iso.replace(' ', 'T'))
}

export function calcDurationFromStart (startIso: string, end = new Date()) {
  const start = parseLocalIso(startIso)
  const seconds = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000))
  return {
    seconds,
    minutes: Math.max(1, Math.round(seconds / 60))
  }
}
