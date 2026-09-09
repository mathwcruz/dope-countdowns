import { NewTimerForm } from '@/components/NewTimerForm'
import { SettingsDialog } from '@/components/SettingsDialog'
import { TimerCard } from '@/components/TimerCard'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLocalStorage, useTimers, type TimersApi } from '@/hooks/useTimers'
import { formatClock, sortTimers, DEFAULT_SORT, SORTS, type SortKey } from '@/lib/timers'
import { AnimatePresence } from 'motion/react'
import { X } from 'lucide-react'
import { useEffect } from 'react'

const BASE_TITLE = 'Dope Countdowns'

function SortSelect({ label, value, onChange }: { label: string; value: SortKey; onChange: (key: SortKey) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as SortKey)}>
      <SelectTrigger aria-label={label} className="h-8 w-60 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SORTS.map(([key, text]) => (
          <SelectItem key={key} value={key} className="text-xs">
            {text}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function TimerSection({
  title,
  entries,
  sort,
  onSortChange,
  api,
}: {
  title: string
  entries: TimersApi['timers']
  sort: SortKey
  onSortChange: (key: SortKey) => void
  api: TimersApi
}) {
  if (entries.length === 0) return null
  sort = SORTS.some(([k]) => k === sort) ? sort : DEFAULT_SORT
  return (
    <section className="flex flex-col gap-3" aria-label={title}>
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">
          {title} <span className="text-sm font-normal text-muted-foreground">({entries.length})</span>
        </h2>
        <SortSelect label={`Sort ${title}`} value={sort} onChange={onSortChange} />
      </div>
      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:flex lg:flex-wrap">
        <AnimatePresence initial={false} mode="popLayout">
          {sortTimers(entries, sort).map(({ timer, remaining }) => (
            <TimerCard
              key={timer.id}
              timer={timer}
              remaining={remaining}
              onPause={api.actions.pause}
              onResume={api.actions.resume}
              onRemove={api.actions.remove}
              onRerun={api.actions.rerun}
            />
          ))}
        </AnimatePresence>
      </ul>
    </section>
  )
}

export default function App() {
  const api = useTimers()
  const { timers } = api

  const [activeSort, setActiveSort] = useLocalStorage<SortKey>('dope-countdowns:sort-active', DEFAULT_SORT)
  const [finishedSort, setFinishedSort] = useLocalStorage<SortKey>('dope-countdowns:sort-finished', DEFAULT_SORT)

  const active = timers.filter((t) => t.timer.status !== 'finished')
  const running = timers.filter((t) => t.timer.status === 'running')

  useEffect(() => {
    if (active.length === 0) {
      document.title = BASE_TITLE
      return
    }
    const soonest = active.reduce((a, b) => (a.remaining <= b.remaining ? a : b))
    document.title = `${soonest.timer.title || 'Untitled'} · ${formatClock(soonest.remaining)}`
  }, [active])

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
        <SettingsDialog settings={api.settings} onSettingsChange={api.setSettings} />
      </header>

      <main className="mx-auto flex w-full max-w-full flex-col gap-8">
        <NewTimerForm
          existingTitles={[...timers.map((t) => t.timer.title), ...api.favorites.map((f) => f.title)]}
          onStart={api.actions.start}
        />

        {api.favorites.length > 0 && (
          <section className="flex flex-col gap-3" aria-label="Favourite timers">
            <h2 className="text-lg font-semibold">
              Favourite timers{' '}
              <span className="text-sm font-normal text-muted-foreground">({api.favorites.length})</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {api.favorites.map((f) => (
                <span
                  key={`${f.title}\u0000${f.durationMs}`}
                  className="inline-flex items-stretch overflow-hidden rounded-full border border-border bg-background-600 text-xs transition-colors hover:border-accent hover:text-accent"
                >
                  <button
                    type="button"
                    onClick={() => api.actions.start(f.title, f.durationMs, { favorite: true, deleteWhenFinished: false })}
                    aria-label={`Start ${f.title || 'Untitled'} for ${formatClock(f.durationMs)}`}
                    className="px-3 py-1"
                  >
                    {f.title || 'Untitled'} · {formatClock(f.durationMs)}
                  </button>
                  <button
                    type="button"
                    onClick={() => api.actions.removeFavorite(f)}
                    aria-label={`Remove ${f.title || 'Untitled'} for ${formatClock(f.durationMs)} from favourites`}
                    className="border-l border-border px-2 text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-3" aria-hidden />
                  </button>
                </span>
              ))}
            </div>
          </section>
        )}

        {timers.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No timers yet. Type a duration like 5:00 and hit Start.
          </p>
        ) : (
          <>
            <TimerSection
              title="Active timers"
              entries={timers.filter((t) => t.timer.status !== 'finished')}
              sort={activeSort}
              onSortChange={setActiveSort}
              api={api}
            />
            <TimerSection
              title="Finished timers"
              entries={timers.filter((t) => t.timer.status === 'finished')}
              sort={finishedSort}
              onSortChange={setFinishedSort}
              api={api}
            />
          </>
        )}
      </main>
    </div>
  )
}
