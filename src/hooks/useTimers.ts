import { playAlarm, type SoundPreset } from '@/lib/sound'
import {
  createTimer,
  duplicate,
  normalize,
  pause,
  recordUsage,
  remainingMs,
  resume,
  type Suggestion,
  type Timer,
  type Usage,
  topSuggestions,
} from '@/lib/timers'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useLocalStorageCjs from 'use-local-storage'

const useLocalStorage =
  (useLocalStorageCjs as unknown as { default?: typeof useLocalStorageCjs })
    .default ?? useLocalStorageCjs

export interface Settings {
  sound: SoundPreset
  repeats: number
}

const DEFAULT_SETTINGS: Settings = { sound: 'chime', repeats: 3 }

const KEYS = {
  timers: 'dope-countdowns:timers',
  usage: 'dope-countdowns:usage',
  settings: 'dope-countdowns:settings',
}

export function useTimers() {
  const [timers, setTimers] = useLocalStorage<Timer[]>(KEYS.timers, [])
  const [usage, setUsage] = useLocalStorage<Usage>(KEYS.usage, {})
  const [settings, setSettings] = useLocalStorage<Settings>(
    KEYS.settings,
    DEFAULT_SETTINGS,
  )
  const [now, setNow] = useState(() => Date.now())

  const anyRunning = useMemo(
    () => timers.some((t) => normalize(t, now).status === 'running'),
    [timers, now],
  )

  useEffect(() => {
    if (!anyRunning) return
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [anyRunning])

  const view = useMemo(
    () =>
      timers.map((t) => {
        const norm = normalize(t, now)
        return { timer: norm, remaining: remainingMs(norm, now) }
      }),
    [timers, now],
  )

  const mounted = useRef(false)
  const announced = useRef<Set<string>>(new Set())
  useEffect(() => {
    const finished = view.filter((v) => v.timer.status === 'finished')
    if (!mounted.current) {
      mounted.current = true
      for (const v of finished) announced.current.add(v.timer.id)
      return
    }
    const fresh = finished.filter((v) => !announced.current.has(v.timer.id))
    for (const v of fresh) announced.current.add(v.timer.id)
    if (fresh.length > 0) playAlarm(settings.sound, settings.repeats)
  }, [view, settings.sound, settings.repeats])

  const update = useCallback(
    (id: string, fn: (t: Timer) => Timer) =>
      setTimers((prev) => prev?.map((t) => (t.id === id ? fn(t) : t))),
    [setTimers],
  )

  const actions = useMemo(
    () => ({
      start: (title: string, durationMs: number) => {
        if (durationMs <= 0) return
        setTimers((prev) => [...(prev ?? []), createTimer(title, durationMs)])
        setUsage((prev) => recordUsage(prev ?? {}, title, durationMs))
      },
      pause: (id: string) => update(id, (t) => pause(t, Date.now())),
      resume: (id: string) => update(id, (t) => resume(t, Date.now())),
      remove: (id: string) => {
        announced.current.delete(id)
        setTimers((prev) => prev?.filter((t) => t.id !== id))
      },
      duplicate: (id: string) => {
        const source = timers.find((t) => t.id === id)
        if (!source) return
        setTimers((prev) => [...(prev ?? []), duplicate(source, Date.now())])
        setUsage((prev) => recordUsage(prev ?? {}, source.title, source.durationMs))
      },
    }),
    [timers, update, setTimers, setUsage],
  )

  const suggestions: Suggestion[] = useMemo(() => topSuggestions(usage), [usage])

  return { timers: view, actions, suggestions, settings, setSettings }
}

export type TimersApi = ReturnType<typeof useTimers>
