import { TimeInput } from '@/components/TimeInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { digitsToMs } from '@/lib/timers'
import { Play, Star } from 'lucide-react'
import { useState, type SubmitEvent } from 'react'

interface NewTimerFormProps {
  existingTitles: string[]
  onStart: (title: string, durationMs: number, opts: { favorite: boolean; deleteWhenFinished: boolean }) => void
}

export function NewTimerForm({ existingTitles, onStart }: NewTimerFormProps) {
  const [title, setTitle] = useState('')
  const [digits, setDigits] = useState('')
  const [favorite, setFavorite] = useState(false)
  const [deleteWhenFinished, setDeleteWhenFinished] = useState(true)
  const durationMs = digitsToMs(digits)
  const duplicateTitle =
    title.trim() !== '' &&
    existingTitles.some((t) => t.trim().toLowerCase() === title.trim().toLowerCase())

  const submit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (durationMs <= 0 || duplicateTitle) return
    onStart(title, durationMs, { favorite, deleteWhenFinished })
    setTitle('')
    setDigits('')
    setFavorite(false)
    setDeleteWhenFinished(true)
    ;(document.activeElement as HTMLElement | null)?.blur()
  }

  return (
    <form onSubmit={submit} className="flex flex-col items-start gap-5">
      <div className="flex w-full flex-col gap-1">
        <div className="flex w-full items-center gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Wash the dishes..."
            aria-label="Timer title"
            aria-invalid={duplicateTitle || undefined}
            className="h-12 w-full max-w-[25rem]"
          />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={favorite ? 'Remove from favourites' : 'Mark as favourite'}
          aria-pressed={favorite}
          onClick={() => setFavorite((f) => !f)}
          className={favorite ? 'text-accent-hover' : 'text-muted-foreground'}
        >
          <Star className={favorite ? 'fill-accent-hover' : ''} aria-hidden />
        </Button>
      </div>
        {duplicateTitle && (
          <p role="alert" className="text-xs text-destructive">
            A timer with this title already exists
          </p>
        )}
      </div>

      <div className="flex w-full max-w-[25rem] flex-row flex-wrap items-center justify-between gap-3">
        <TimeInput digits={digits} onDigitsChange={setDigits} aria-label="Duration" />
        <Button
          type="submit"
          disabled={durationMs <= 0 || duplicateTitle}
          className="min-h-20 px-6 text-[1.2rem]"
        >
          <Play data-icon="inline-start" aria-hidden />
          Start
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="delete-when-finished"
          checked={deleteWhenFinished}
          onCheckedChange={setDeleteWhenFinished}
        />
        <Label htmlFor="delete-when-finished" className="text-sm text-muted-foreground">
          Delete when finished
        </Label>
      </div>
    </form>
  )
}
