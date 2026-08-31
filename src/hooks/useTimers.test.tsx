import { playAlarm } from '@/lib/sound'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { useTimers } from './useTimers'

vi.mock('@/lib/sound', () => ({ playAlarm: vi.fn() }))

function key(k: string) {
  return `dope-countdowns:${k}`
}

describe('useTimers', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(playAlarm).mockClear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-31T12:00:00Z'))
  })

  afterEach(() => vi.useRealTimers())

  it('starts a timer and persists it to localStorage', async () => {
    const { result } = renderHook(() => useTimers())
    act(() => {})
    act(() => result.current.actions.start('Tea', 60_000))

    expect(result.current.timers).toHaveLength(1)
    expect(result.current.timers[0].timer.title).toBe('Tea')
    expect(result.current.timers[0].timer.status).toBe('running')

    expect(JSON.parse(localStorage.getItem(key('timers'))!)[0].title).toBe('Tea')
    expect(JSON.parse(localStorage.getItem(key('usage'))!)['60000'].count).toBe(1)
  })

  it('plays the alarm once when the timer hits zero', async () => {
    const { result } = renderHook(() => useTimers())
    act(() => {})
    act(() => result.current.actions.start('Tea', 60_000))

    act(() => {
      vi.advanceTimersByTime(61_000)
    })
    expect(result.current.timers[0].timer.status).toBe('finished')
    expect(playAlarm).toHaveBeenCalledTimes(1)
    expect(result.current.timers[0].remaining).toBe(0)
  })

  it('does not replay the alarm for timers that finished while away', async () => {
    localStorage.setItem(key('timers'), JSON.stringify([
      {
        id: 'old',
        title: 'Tea',
        durationMs: 60_000,
        remainingMs: 60_000,
        endsAt: Date.now() - 5_000,
        status: 'running',
        createdAt: Date.now() - 65_000,
      },
    ]))

    const { result } = renderHook(() => useTimers())
    act(() => {})
    expect(result.current.timers[0].timer.status).toBe('finished')
    expect(playAlarm).not.toHaveBeenCalled()
  })

  it('pause freezes remaining and resume continues', async () => {
    const { result } = renderHook(() => useTimers())
    act(() => {})
    act(() => result.current.actions.start('Tea', 60_000))
    const id = result.current.timers[0].timer.id

    act(() => {
      vi.advanceTimersByTime(20_000)
      result.current.actions.pause(id)
    })
    expect(result.current.timers[0].remaining).toBe(40_000)
    expect(result.current.timers[0].timer.status).toBe('paused')

    act(() => {
      vi.advanceTimersByTime(30_000) // paused: nothing moves
    })
    expect(result.current.timers[0].remaining).toBe(40_000)

    act(() => result.current.actions.resume(id))
    act(() => vi.advanceTimersByTime(10_000))
    expect(result.current.timers[0].remaining).toBe(30_000)
  })

  it('suggests the most started durations', async () => {
    const { result } = renderHook(() => useTimers())
    act(() => {})
    act(() => result.current.actions.start('A', 60_000))
    act(() => result.current.actions.start('A2', 60_000))
    act(() => result.current.actions.start('B', 120_000))

    expect(result.current.suggestions.map((s) => s.durationMs)).toEqual([
      60_000, 120_000,
    ])
    expect(result.current.suggestions[0].title).toBe('A')
  })
})
