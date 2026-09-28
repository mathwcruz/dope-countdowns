import { playAlarm, type SoundPreset } from '@/lib/sound'
import {
  addFavorite,
  autoDelete,
  createTimer,
  duplicate,
  normalize,
  pause,
  removeFavorite,
  remainingMs,
  resume,
  type FavoriteDef,
  type Timer,
  type TimerOptions,
} from '@/lib/timers'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useLocalStorageCjs from 'use-local-storage'

export const useLocalStorage =
  (useLocalStorageCjs as unknown as { default?: typeof useLocalStorageCjs })
    .default ?? useLocalStorageCjs

export interface Settings {
  sound: SoundPreset
  repeats: number
  volume: number
}

const DEFAULT_SETTINGS: Settings = { sound: 'chime', repeats: 3, volume: 0.8 }

const KEYS = {
  timers: 'dope-countdowns:timers',
  settings: 'dope-countdowns:settings',
  favourites: 'dope-countdowns:favourites',
}

export function useTimers() {
  const [timers, setTimers] = useLocalStorage<Timer[]>(KEYS.timers, [])
  const [favorites, setFavorites] = useLocalStorage<FavoriteDef[]>(KEYS.favourites, [])
  const [storedSettings, setSettings] = useLocalStorage<Settings>(
    KEYS.settings,
    DEFAULT_SETTINGS,
  )
  const settings = useMemo(
    () => ({ ...DEFAULT_SETTINGS, ...storedSettings }),
    [storedSettings],
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
      const stale = finished.filter((v) => autoDelete(v.timer))
      if (stale.length > 0) {
        setTimers((prev) => prev?.filter((t) => !stale.some((s) => s.timer.id === t.id)))
      }
      return
    }
    const fresh = finished.filter((v) => !announced.current.has(v.timer.id))
    for (const v of fresh) announced.current.add(v.timer.id)
    if (fresh.length > 0) {
      playAlarm(settings.sound, settings.repeats, settings.volume)
      const doomed = fresh.filter((v) => autoDelete(v.timer))
      if (doomed.length > 0) {
        doomed.forEach((v) => announced.current.delete(v.timer.id))
        setTimers((prev) => prev?.filter((t) => !doomed.some((d) => d.timer.id === t.id)))
      }
    }
  }, [view, settings.sound, settings.repeats])

  const update = useCallback(
    (id: string, fn: (t: Timer) => Timer) =>
      setTimers((prev) => prev?.map((t) => (t.id === id ? fn(t) : t))),
    [setTimers],
  )

  const actions = useMemo(
    () => ({
      start: (title: string, durationMs: number, opts?: TimerOptions) => {
        if (durationMs <= 0) return
        const now = Date.now()
        const name = title.trim().toLowerCase()
        const sameTitle = (t: Timer) => name !== '' && t.title.trim().toLowerCase() === name
        if (timers.some((t) => sameTitle(t) && remainingMs(t, now) > 0)) return
        setTimers((prev) => [
          ...(prev ?? []).filter(
            (t) => !(sameTitle(t) && t.durationMs === durationMs && remainingMs(t, now) <= 0),
          ),
          createTimer(title, durationMs, now, opts),
        ])
        if (opts?.favorite) setFavorites((prev) => addFavorite(prev ?? [], { title: title.trim(), durationMs }))
      },
      pause: (id: string) => update(id, (t) => pause(t, Date.now())),
      resume: (id: string) => update(id, (t) => resume(t, Date.now())),
      remove: (id: string) => {
        announced.current.delete(id)
        setTimers((prev) => prev?.filter((t) => t.id !== id))
      },
      removeFavorite: (def: FavoriteDef) => setFavorites((prev) => removeFavorite(prev ?? [], def)),
      rerun: (id: string) => {
        const source = timers.find((t) => t.id === id)
        if (!source) return
        const copy = duplicate(source, Date.now())
        announced.current.delete(id)
        setTimers((prev) => [
          ...(prev ?? []).filter((t) => t.id !== id),
          copy,
        ])
      },
    }),
    [timers, update, setTimers, setFavorites],
  )

  return { timers: view, actions, favorites, settings, setSettings }
}

export type TimersApi = ReturnType<typeof useTimers>
