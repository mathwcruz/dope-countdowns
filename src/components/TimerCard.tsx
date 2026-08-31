import { Button } from '@/components/ui/button'
import { formatClock, type Timer } from '@/lib/timers'
import { Copy, Pause, Play, Trash2 } from 'lucide-react'

interface TimerCardProps {
  timer: Timer
  remaining: number
  onPause: (id: string) => void
  onResume: (id: string) => void
  onRemove: (id: string) => void
  onDuplicate: (id: string) => void
}

export function TimerCard({
  timer,
  remaining,
  onPause,
  onResume,
  onRemove,
  onDuplicate,
}: TimerCardProps) {
  const finished = timer.status === 'finished'
  const running = timer.status === 'running'
  const progress = timer.durationMs > 0 ? remaining / timer.durationMs : 0

  return (
    <li
      aria-label={`Timer ${timer.title || 'Untitled'}, ${formatClock(remaining)} ${
        finished ? 'finished' : timer.status
      }`}
      className={`flex flex-col gap-4 rounded-xl border bg-background-600 p-5 ${
        finished ? 'border-accent' : 'border-transparent'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-sm text-muted-foreground" title={timer.title}>
          {timer.title || 'Untitled timer'}
        </p>
        {finished && (
          <span className="rounded bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
            Time&apos;s up
          </span>
        )}
      </div>

      <p
        className={`text-4xl font-semibold tabular-nums tracking-tight xl:text-5xl ${
          finished ? 'text-accent' : ''
        }`}
        aria-label={finished ? 'Timer finished' : `${formatClock(remaining)} remaining`}
      >
        {formatClock(remaining)}
      </p>

      <div className="h-1.5 rounded-full bg-background-700" role="presentation">
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${
            finished ? 'bg-accent' : 'bg-accent-hover'
          }`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="flex gap-1.5">
        {finished ? (
          <Button variant="outline" size="sm" onClick={() => onDuplicate(timer.id)}>
            <Play data-icon="inline-start" aria-hidden />
            Run again
          </Button>
        ) : running ? (
          <Button variant="outline" size="sm" onClick={() => onPause(timer.id)}>
            <Pause data-icon="inline-start" aria-hidden />
            Pause
          </Button>
        ) : (
          <Button size="sm" onClick={() => onResume(timer.id)}>
            <Play data-icon="inline-start" aria-hidden />
            Resume
          </Button>
        )}
        {!finished && (
          <Button variant="ghost" size="icon-sm" aria-label="Duplicate timer" onClick={() => onDuplicate(timer.id)}>
            <Copy aria-hidden />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={finished ? 'Clear timer' : 'Delete timer'}
          className="ml-auto text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(timer.id)}
        >
          <Trash2 aria-hidden />
        </Button>
      </div>
    </li>
  )
}
