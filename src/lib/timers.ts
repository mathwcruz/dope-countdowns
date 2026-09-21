export type TimerStatus = 'running' | 'paused' | 'finished'

export const MAX_TIMER_MS = 24 * 60 * 60 * 1000

export interface Timer {
  id: string
  title: string
  durationMs: number
  remainingMs: number
  endsAt: number | null
  status: TimerStatus
  createdAt: number
  favorite?: boolean
  deleteWhenFinished?: boolean
}

export interface TimerOptions {
  favorite?: boolean
  deleteWhenFinished?: boolean
}

export function createTimer(
  title: string,
  durationMs: number,
  now: number = Date.now(),
  opts: TimerOptions = {},
): Timer {
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    durationMs,
    remainingMs: durationMs,
    endsAt: now + durationMs,
    status: 'running',
    createdAt: now,
    favorite: opts.favorite ?? false,
    deleteWhenFinished: opts.deleteWhenFinished ?? true,
  }
}

export const autoDelete = (t: Timer) => t.deleteWhenFinished ?? true

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
  return createTimer(timer.title, timer.durationMs, now, {
    favorite: timer.favorite,
    deleteWhenFinished: timer.deleteWhenFinished,
  })
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

export interface FavoriteDef {
  title: string
  durationMs: number
}

export function addFavorite(list: FavoriteDef[], def: FavoriteDef): FavoriteDef[] {
  const key = (f: FavoriteDef) => `${f.title.trim()}\u0000${f.durationMs}`
  return [def, ...list.filter((f) => key(f) !== key(def))]
}

export function removeFavorite(list: FavoriteDef[], def: FavoriteDef): FavoriteDef[] {
  const key = (f: FavoriteDef) => `${f.title.trim()}\u0000${f.durationMs}`
  return list.filter((f) => key(f) !== key(def))
}

export interface TimerEntry {
  timer: Timer
  remaining: number
}

export const SORTS = [
  ['title-az', 'Title (A-Z)'],
  ['created-asc', 'Created (oldest first)'],
  ['created-desc', 'Created (newest first)'],
  ['duration-desc', 'Duration (longest first)'],
  ['duration-asc', 'Duration (shortest first)'],
  ['favorite', 'Favourite'],
] as const

export type SortKey = (typeof SORTS)[number][0]
export const DEFAULT_SORT: SortKey = 'created-desc'

export function sortTimers(entries: TimerEntry[], key: SortKey): TimerEntry[] {
  const list = [...entries]
  switch (key) {
    case 'title-az':
      list.sort((a, b) =>
        (a.timer.title || 'Untitled').localeCompare(b.timer.title || 'Untitled'),
      )
      break
    // ponytail: sorts by live remaining (re-sorts on every tick), durationMs tiebreak keeps finished timers (remaining all 0) ordered
    case 'duration-desc':
      list.sort((a, b) => b.remaining - a.remaining || b.timer.durationMs - a.timer.durationMs)
      break
    case 'duration-asc':
      list.sort((a, b) => a.remaining - b.remaining || a.timer.durationMs - b.timer.durationMs)
      break
    case 'favorite':
      list.sort((a, b) => Number(b.timer.favorite ?? false) - Number(a.timer.favorite ?? false))
      break
    case 'created-asc':
      list.sort((a, b) => a.timer.createdAt - b.timer.createdAt)
      break
    default:
      list.sort((a, b) => b.timer.createdAt - a.timer.createdAt)
  }
  return list
}
