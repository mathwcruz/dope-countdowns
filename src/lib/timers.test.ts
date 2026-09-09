import type { Timer } from './timers'
import {
  createTimer,
  digitsToMs,
  duplicate,
  formatClock,
  formatDigits,
  normalize,
  pause,
  sortTimers,
  removeFavorite,
  remainingMs,
  resume,
} from './timers'
import { describe, expect, it } from 'vitest'

const NOW = 1_000_000

describe('timer lifecycle', () => {
  it('starts running with endsAt = now + duration', () => {
    const t = createTimer('Tea', 60_000, NOW)
    expect(t.status).toBe('running')
    expect(t.endsAt).toBe(NOW + 60_000)
    expect(remainingMs(t, NOW)).toBe(60_000)
  })

  it('pause freezes remaining at the wall clock, resume extends endsAt', () => {
    const t = createTimer('Tea', 60_000, NOW)
    const paused = pause(t, NOW + 20_000)
    expect(paused.status).toBe('paused')
    expect(paused.endsAt).toBeNull()
    expect(remainingMs(paused, NOW + 999_999)).toBe(40_000) // frozen in time

    const resumed = resume(paused, NOW + 30_000)
    expect(resumed.endsAt).toBe(NOW + 30_000 + 40_000)
    expect(remainingMs(resumed, NOW + 30_000)).toBe(40_000)
  })

  it('time passing while "away" is accounted for (persistence premise)', () => {
    const t = createTimer('Tea', 60_000, NOW)
    // app closed at NOW, reopened 90s later
    const reopened = normalize(t, NOW + 90_000)
    expect(reopened.status).toBe('finished')
    expect(remainingMs(reopened, NOW + 90_000)).toBe(0)
  })

  it('duplicate restarts a fresh copy with the same settings', () => {
    const t = pause(createTimer('Tea', 60_000, NOW, { favorite: true, deleteWhenFinished: false }), NOW + 10_000)
    const copy = duplicate(t, NOW)
    expect(copy.id).not.toBe(t.id)
    expect(copy.title).toBe('Tea')
    expect(copy.durationMs).toBe(60_000)
    expect(copy.status).toBe('running')
    expect(copy.favorite).toBe(true)
    expect(copy.deleteWhenFinished).toBe(false)
    expect(remainingMs(copy, NOW)).toBe(60_000)
  })

  it('pause and resume are no-ops in the wrong state', () => {
    const paused = pause(createTimer('Tea', 60_000, NOW), NOW)
    expect(pause(paused, NOW)).toBe(paused)
    expect(resume(paused, NOW)).not.toBe(paused)
  })
})

describe('formatting', () => {
  it('formats clock as HH:MM:SS', () => {
    expect(formatClock(0)).toBe('00:00:00')
    expect(formatClock(59_000)).toBe('00:00:59')
    expect(formatClock(3_660_000)).toBe('01:01:00')
    expect(formatClock(36_610_000)).toBe('10:10:10')
  })

  it('parses digit streams right-aligned like the Google mask', () => {
    expect(digitsToMs('936')).toBe(9 * 60_000 + 36 * 1000) // 00:09:36
    expect(digitsToMs('13600')).toBe(5_760_000) // 01:36:00
    expect(digitsToMs('')).toBe(0)
  })

  it('re-normalizes overflow digits when formatting', () => {
    expect(formatDigits('93')).toBe('00:01:33') // 93 seconds
    expect(formatDigits('999999')).toBe('100:40:39') // 99:99:99 overflows to 100h40m39s
  })
})

describe('sortTimers', () => {
  const entry = (t: Timer) => ({ timer: t, remaining: 0 })

  it('sorts by title a-z with Untitled fallback', () => {
    const list = [
      entry(createTimer('Zeta', 60_000, NOW)),
      entry(createTimer('', 60_000, NOW)),
      entry(createTimer('alpha', 60_000, NOW)),
    ]
    expect(sortTimers(list, 'title-az').map((e) => e.timer.title || 'Untitled')).toEqual([
      'alpha',
      'Untitled',
      'Zeta',
    ])
  })

  it('sorts by created date asc and desc (desc is the default key)', () => {
    const list = [
      entry(createTimer('A', 60_000, NOW)),
      entry(createTimer('B', 60_000, NOW + 10)),
      entry(createTimer('C', 60_000, NOW + 20)),
    ]
    expect(sortTimers(list, 'created-asc').map((e) => e.timer.title)).toEqual(['A', 'B', 'C'])
    expect(sortTimers(list, 'created-desc').map((e) => e.timer.title)).toEqual(['C', 'B', 'A'])
  })

  it('sorts by duration longest and shortest first', () => {
    const list = [
      entry(createTimer('A', 30_000, NOW)),
      entry(createTimer('B', 90_000, NOW)),
      entry(createTimer('C', 60_000, NOW)),
    ]
    expect(sortTimers(list, 'duration-desc').map((e) => e.timer.title)).toEqual(['B', 'C', 'A'])
    expect(sortTimers(list, 'duration-asc').map((e) => e.timer.title)).toEqual(['A', 'C', 'B'])
  })

  it('sorts favourites first', () => {
    const list = [
      entry(createTimer('A', 60_000, NOW)),
      entry(createTimer('B', 60_000, NOW, { favorite: true })),
      entry(createTimer('C', 60_000, NOW)),
    ]
    expect(sortTimers(list, 'favorite').map((e) => e.timer.title)).toEqual(['B', 'A', 'C'])
  })
})

describe('favourites', () => {
  it('removes only the matching title+duration entry', () => {
    const list = [
      { title: 'Tea', durationMs: 60_000 },
      { title: 'Tea', durationMs: 300_000 },
      { title: ' Tea ', durationMs: 60_000 },
    ]
    const kept = removeFavorite(list, { title: 'Tea', durationMs: 60_000 })
    expect(kept).toEqual([{ title: 'Tea', durationMs: 300_000 }])
  })
})
