import { NewTimerForm } from '@/components/NewTimerForm'
import { SettingsDialog } from '@/components/SettingsDialog'
import { TimerCard } from '@/components/TimerCard'
import { useTimers } from '@/hooks/useTimers'
import { formatClock } from '@/lib/timers'
import { Plus } from 'lucide-react'
import { useEffect } from 'react'

const BASE_TITLE = 'Dope Countdowns'

export default function App() {
  const { timers, actions, suggestions, settings, setSettings } = useTimers()

  const running = timers.filter((t) => t.timer.status === 'running')

  useEffect(() => {
    document.title =
      running.length > 0
        ? `${formatClock(Math.min(...running.map((t) => t.remaining)))} — ${BASE_TITLE}`
        : BASE_TITLE
  }, [running])

  useEffect(() => {
    if (running.length === 0) return
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [running.length])

  return (
    <div className="container min-h-dvh py-8">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold xl:text-3xl">Dope Countdowns</h1>
        <SettingsDialog settings={settings} onSettingsChange={setSettings} />
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-6">
        <NewTimerForm onStart={actions.start} />

        {suggestions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Quick start
            </span>
            {suggestions.map((s) => (
              <button
                key={s.durationMs}
                type="button"
                onClick={() => actions.start(s.title, s.durationMs)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background-600 px-3 py-1 text-xs transition-colors hover:border-accent hover:text-accent"
                aria-label={`Start ${s.title || formatClock(s.durationMs)} for ${formatClock(s.durationMs)}`}
              >
                <Plus className="size-3" aria-hidden />
                {s.title ? `${s.title} · ` : ''}
                {formatClock(s.durationMs)}
              </button>
            ))}
          </div>
        )}

        {timers.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No timers yet. Type a duration like 5:00 and hit Start.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {timers.map(({ timer, remaining }) => (
              <TimerCard
                key={timer.id}
                timer={timer}
                remaining={remaining}
                onPause={actions.pause}
                onResume={actions.resume}
                onRemove={actions.remove}
                onDuplicate={actions.duplicate}
              />
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
