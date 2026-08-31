import { Input } from '@/components/ui/input'
import { formatDigits } from '@/lib/timers'

interface TimeInputProps {
  digits: string
  onDigitsChange: (digits: string) => void
  'aria-label'?: string
}

export function TimeInput({ digits, onDigitsChange, ...rest }: TimeInputProps) {
  const display = digits ? formatDigits(digits) : ''

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    const prev = display.replace(/\D/g, '')
    if (raw.length > prev.length) {
      if (raw.startsWith(prev)) {
        onDigitsChange((digits + raw.slice(prev.length)).slice(-6))
      } else {
        onDigitsChange(raw.slice(-6))
      }
    } else if (raw.length < prev.length) {
      onDigitsChange(digits.slice(0, -(prev.length - raw.length)))
    }
  }

  return (
    <Input
      inputMode="numeric"
      autoComplete="off"
      placeholder="00:00"
      value={display}
      onChange={handleChange}
      className="h-14 text-center text-3xl font-semibold tabular-nums tracking-tight"
      {...rest}
    />
  )
}
