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
  })

  it('plays the alarm once and removes the timer when auto-delete is on (default)', async () => {
    const { result } = renderHook(() => useTimers())
    act(() => result.current.actions.start('Tea', 60_000))

    act(() => {
      vi.advanceTimersByTime(61_000)
    })
    expect(result.current.timers).toHaveLength(0)
    expect(playAlarm).toHaveBeenCalledTimes(1)
  })

  it('keeps finished timers when delete-when-finished is off', async () => {
    const { result } = renderHook(() => useTimers())
    act(() => result.current.actions.start('Tea', 60_000, { deleteWhenFinished: false }))

    act(() => {
      vi.advanceTimersByTime(61_000)
    })
    expect(result.current.timers[0].timer.status).toBe('finished')
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
        deleteWhenFinished: false,
      },
    ]))

    const { result } = renderHook(() => useTimers())
    act(() => {})
    expect(result.current.timers[0].timer.status).toBe('finished')
    expect(playAlarm).not.toHaveBeenCalled()
  })

  it('rerun replaces a finished timer with a fresh running one', async () => {
    const { result } = renderHook(() => useTimers())
    act(() => result.current.actions.start('Tea', 60_000, { favorite: true, deleteWhenFinished: false }))
    const id = result.current.timers[0].timer.id

    act(() => {
      vi.advanceTimersByTime(61_000)
    })
    expect(result.current.timers[0].timer.status).toBe('finished')

    act(() => result.current.actions.rerun(id))
    expect(result.current.timers).toHaveLength(1)
    expect(result.current.timers[0].timer.id).not.toBe(id)
    expect(result.current.timers[0].timer.status).toBe('running')
    expect(result.current.timers[0].timer.favorite).toBe(true)
    expect(result.current.timers[0].remaining).toBe(60_000)
  })

  it('registers started favourites once per title and duration', async () => {
    const { result } = renderHook(() => useTimers())
    act(() => result.current.actions.start('Coffee', 300_000, { favorite: true }))
    act(() => result.current.actions.remove(result.current.timers[0].timer.id))
    act(() => result.current.actions.start('Coffee', 300_000, { favorite: true }))
    act(() => result.current.actions.start('Espresso', 600_000, { favorite: true }))
    act(() => result.current.actions.start('Plain', 60_000))

    expect(result.current.favorites).toEqual([
      { title: 'Espresso', durationMs: 600_000 },
      { title: 'Coffee', durationMs: 300_000 },
    ])
  })

  it('rejects duplicate titles regardless of case, allows repeated empty titles', async () => {
    const { result } = renderHook(() => useTimers())
    act(() => result.current.actions.start('Tea', 60_000))
    act(() => result.current.actions.start('  tea  ', 90_000))
    act(() => result.current.actions.start('', 60_000))
    act(() => result.current.actions.start('', 60_000))

    expect(result.current.timers).toHaveLength(3)
    expect(result.current.timers.some((t) => t.timer.durationMs === 90_000)).toBe(false)
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
})

