import { Input } from '@/components/ui/input'
import { formatDigits, MAX_TIMER_MS, digitsToMs } from '@/lib/timers'

interface TimeInputProps {
  digits: string
  onDigitsChange: (digits: string) => void
  'aria-label'?: string
}

export function TimeInput({ digits, onDigitsChange, ...rest }: TimeInputProps) {
  const display = digits ? formatDigits(digits) : ''

  const next = (candidate: string) => {
    if (digitsToMs(candidate) > MAX_TIMER_MS) return
    onDigitsChange(candidate)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    const prev = display.replace(/\D/g, '')
    if (raw.length > prev.length) {
      if (raw.startsWith(prev)) {
        next((digits + raw.slice(prev.length)).slice(-6))
      } else {
        next(raw.slice(-6))
      }
    } else if (raw.length < prev.length) {
      onDigitsChange(digits.slice(0, -(prev.length - raw.length)))
    }
  }

  return (
    <div className="relative min-w-[11rem] max-w-[20rem] flex-1">
      <Input
        inputMode="numeric"
        autoComplete="off"
        placeholder="00:00:00"
        value={display}
        onChange={handleChange}
        aria-label={(rest['aria-label'] ?? 'Duration') + ' (required)'}
        className="min-h-20 w-full text-center text-[2rem] font-semibold tabular-nums tracking-tight leading-none md:text-[2rem]"
        {...rest}
      />
      <span aria-hidden className="absolute top-0.5 right-2 text-lg font-semibold text-red-500">
        *
      </span>
    </div>
  )
}
