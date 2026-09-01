import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { TimeInput } from './TimeInput'

function Harness({ onDigitsChange }: { onDigitsChange: (d: string) => void }) {
  const [digits, setDigits] = useState('')
  return (
    <TimeInput
      digits={digits}
      onDigitsChange={(d) => {
        setDigits(d)
        onDigitsChange(d)
      }}
      aria-label="Duration"
    />
  )
}

function setup() {
  const onDigitsChange = vi.fn()
  render(<Harness onDigitsChange={onDigitsChange} />)
  return { input: screen.getByLabelText('Duration'), onDigitsChange }
}

describe('TimeInput mask', () => {
  it('shows placeholder when empty and formats while typing', async () => {
    const { input, onDigitsChange } = setup()
    expect(input).toHaveDisplayValue('')

    const user = userEvent.setup()
    await user.type(input, '936')
    expect(onDigitsChange).toHaveBeenLastCalledWith('936')
  })

  it('appends digits Google-style and keeps only the last six', async () => {
    const { input, onDigitsChange } = setup()
    const user = userEvent.setup()
    await user.type(input, '1234567')
    expect(onDigitsChange).toHaveBeenLastCalledWith('234567')
  })

  it('ignores non-digits', async () => {
    const { input, onDigitsChange } = setup()
    const user = userEvent.setup()
    await user.type(input, '1a2b')
    expect(onDigitsChange).toHaveBeenLastCalledWith('12')
  })

  it('rejects input beyond 24:00:00', async () => {
    const { input, onDigitsChange } = setup()
    const user = userEvent.setup()
    await user.type(input, '250000')
    expect(onDigitsChange).toHaveBeenLastCalledWith('25000')
  })

  it('shows the required asterisk', () => {
    render(<TimeInput digits="" onDigitsChange={() => {}} aria-label="Duration" />)
    expect(screen.getByText('*')).toBeVisible()
  })

  it('renders formatted value from digits', () => {
    render(<TimeInput digits="936" onDigitsChange={() => {}} aria-label="Duration" />)
    expect(screen.getByLabelText('Duration')).toHaveDisplayValue('00:09:36')
  })
})
