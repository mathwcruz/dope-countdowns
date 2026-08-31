import {
  createTimer,
  digitsToMs,
  duplicate,
  formatClock,
  formatDigits,
  normalize,
  pause,
  recordUsage,
  remainingMs,
  resume,
  topSuggestions,
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

  it('duplicate restarts a fresh copy with the same title and duration', () => {
    const t = pause(createTimer('Tea', 60_000, NOW), NOW + 10_000)
    const copy = duplicate(t, NOW)
    expect(copy.id).not.toBe(t.id)
    expect(copy.title).toBe('Tea')
    expect(copy.durationMs).toBe(60_000)
    expect(copy.status).toBe('running')
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

describe('suggestions', () => {
  it('ranks by count and keeps the first title given to a duration', () => {
    let usage = recordUsage({}, 'Coffee', 300_000)
    usage = recordUsage(usage, 'Whatever', 300_000)
    usage = recordUsage(usage, 'Workout', 1_500_000)

    const top = topSuggestions(usage, 2)
    expect(top[0]).toEqual({ durationMs: 300_000, title: 'Coffee', count: 2 })
    expect(top[1].title).toBe('Workout')
  })

  it('caps suggestions at the limit and drops zero durations', () => {
    let usage = recordUsage({}, '', 0)
    usage = recordUsage(usage, 'A', 1_000)
    usage = recordUsage(usage, 'B', 2_000)
    usage = recordUsage(usage, 'C', 3_000)
    expect(topSuggestions(usage, 2)).toHaveLength(2)
  })
})
