export type TimerStatus = 'running' | 'paused' | 'finished'

export interface Timer {
  id: string
  title: string
  durationMs: number
  remainingMs: number
  endsAt: number | null
  status: TimerStatus
  createdAt: number
}

export function createTimer(
  title: string,
  durationMs: number,
  now: number = Date.now(),
): Timer {
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    durationMs,
    remainingMs: durationMs,
    endsAt: now + durationMs,
    status: 'running',
    createdAt: now,
  }
}

export function remainingMs(timer: Timer, now: number): number {
  if (timer.status === 'running' && timer.endsAt !== null) {
    return Math.max(0, timer.endsAt - now)
  }
  return timer.remainingMs
}

export function pause(timer: Timer, now: number): Timer {
  if (timer.status !== 'running') return timer
  return {
    ...timer,
    status: 'paused',
    remainingMs: remainingMs(timer, now),
    endsAt: null,
  }
}

export function resume(timer: Timer, now: number): Timer {
  if (timer.status !== 'paused') return timer
  return {
    ...timer,
    status: 'running',
    endsAt: now + timer.remainingMs,
  }
}

export function finish(timer: Timer): Timer {
  return { ...timer, status: 'finished', remainingMs: 0, endsAt: null }
}
export function normalize(timer: Timer, now: number): Timer {
  if (timer.status === 'running' && timer.endsAt !== null && timer.endsAt <= now) {
    return finish(timer)
  }
  return timer
}

export function duplicate(timer: Timer, now: number): Timer {
  return createTimer(timer.title, timer.durationMs, now)
}
export function formatClock(ms: number): string {
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}
export function digitsToMs(digits: string): number {
  const d = digits.replace(/\D/g, '').slice(-6).padStart(6, '0')
  const h = Number(d.slice(0, 2))
  const m = Number(d.slice(2, 4))
  const s = Number(d.slice(4, 6))
  return (h * 3600 + m * 60 + s) * 1000
}
export function formatDigits(digits: string): string {
  return formatClock(digitsToMs(digits))
}

export interface UsageStat {
  count: number
  lastTitle: string
}

export type Usage = Record<string, UsageStat>

export interface Suggestion {
  durationMs: number
  title: string
  count: number
}

export function recordUsage(usage: Usage, title: string, durationMs: number): Usage {
  const key = String(durationMs)
  const prev = usage[key] ?? { count: 0, lastTitle: '' }
  return {
    ...usage,
    [key]: {
      count: prev.count + 1,
      lastTitle: prev.lastTitle || title.trim(),
    },
  }
}

export function topSuggestions(usage: Usage, limit = 3): Suggestion[] {
  return Object.entries(usage)
    .map(([key, stat]) => ({
      durationMs: Number(key),
      title: stat.lastTitle,
      count: stat.count,
    }))
    .filter((s) => s.durationMs > 0)
    .sort((a, b) => b.count - a.count || a.durationMs - b.durationMs)
    .slice(0, limit)
}
