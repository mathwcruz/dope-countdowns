import { TimeInput } from '@/components/TimeInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { digitsToMs } from '@/lib/timers'
import { Play } from 'lucide-react'
import { useState, type SubmitEvent } from 'react'

interface NewTimerFormProps {
  onStart: (title: string, durationMs: number) => void
}

export function NewTimerForm({ onStart }: NewTimerFormProps) {
  const [title, setTitle] = useState('')
  const [digits, setDigits] = useState('')
  const durationMs = digitsToMs(digits)

  const submit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (durationMs <= 0) return
    onStart(title, durationMs)
    setDigits('')
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Timer title (optional)"
        aria-label="Timer title"
        className="sm:w-64"
      />
      <TimeInput digits={digits} onDigitsChange={setDigits} aria-label="Duration" />
      <Button type="submit" disabled={durationMs <= 0} className="h-14 px-6 sm:h-auto sm:self-stretch">
        <Play data-icon="inline-start" aria-hidden />
        Start
      </Button>
    </form>
  )
}
