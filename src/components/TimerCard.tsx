import { Button } from '@/components/ui/button'
import { autoDelete, formatClock, type Timer } from '@/lib/timers'
import { Eraser, Pause, Play, RotateCcw, Star, Trash2 } from 'lucide-react'
import { motion } from 'motion/react'

interface TimerCardProps {
  timer: Timer
  remaining: number
  onPause: (id: string) => void
  onResume: (id: string) => void
  onRemove: (id: string) => void
  onRerun: (id: string) => void
}

export function TimerCard({
  timer,
  remaining,
  onPause,
  onResume,
  onRemove,
  onRerun,
}: TimerCardProps) {
  const finished = timer.status === 'finished'
  const running = timer.status === 'running'

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      aria-label={`Timer ${timer.title || 'Untitled'}, ${formatClock(remaining)} ${
        finished ? 'finished' : timer.status
      }`}
      className={`flex w-full flex-col gap-4 rounded-xl border-[1.5px] border-white bg-background-600 p-5 sm:w-[20rem] ${
        finished ? 'border-accent' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-sm text-muted-foreground" title={timer.title}>
          {timer.title || 'Untitled timer'}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          {finished && (
            <span className="rounded bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
              Time&apos;s up
            </span>
          )}
          {autoDelete(timer) && (
            <span title="Removed automatically when finished" className="text-muted-foreground">
              <Eraser className="size-3.5" aria-hidden />
            </span>
          )}
          <span
            title={timer.favorite ? 'Favourite' : 'Not favourite'}
            className={timer.favorite ? 'text-accent-hover' : 'text-muted-foreground'}
          >
            <Star
              className={`size-3.5 ${timer.favorite ? 'fill-accent-hover' : ''}`}
              aria-hidden
            />
          </span>
        </div>
      </div>

      <p
        className={`text-4xl font-semibold tabular-nums tracking-tight xl:text-5xl ${
          finished ? 'text-accent' : ''
        }`}
      >
        {formatClock(remaining)}
      </p>

      <div className="flex gap-1.5">
        {finished ? (
          <Button variant="outline" size="sm" onClick={() => onRerun(timer.id)}>
            <RotateCcw data-icon="inline-start" aria-hidden />
            Run again
          </Button>
        ) : running ? (
          <Button
            variant="outline"
            size="sm"
            className="hover:border-accent hover:text-accent"
            onClick={() => onPause(timer.id)}
          >
            <Pause data-icon="inline-start" aria-hidden />
            Pause
          </Button>
        ) : (
          <Button
            size="sm"
            className="hover:bg-accent-hover"
            onClick={() => onResume(timer.id)}
          >
            <Play data-icon="inline-start" aria-hidden />
            Resume
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={finished ? 'Clear timer' : 'Delete timer'}
          className="ml-auto border-transparent bg-transparent text-muted-foreground hover:border-transparent hover:bg-transparent dark:hover:bg-transparent hover:text-destructive"
          onClick={() => onRemove(timer.id)}
        >
          <Trash2 aria-hidden />
        </Button>
      </div>
    </motion.li>
  )
}
