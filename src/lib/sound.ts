export const SOUND_PRESETS = ['beep', 'alarm', 'chime', 'digital'] as const
export type SoundPreset = (typeof SOUND_PRESETS)[number]

interface Note {
  freq: number
  at: number
  dur: number
  type: OscillatorType
  gain: number
}

const PATTERNS: Record<SoundPreset, { notes: Note[]; length: number }> = {
  beep: {
    length: 0.45,
    notes: [
      { freq: 880, at: 0, dur: 0.12, type: 'sine', gain: 0.5 },
      { freq: 880, at: 0.2, dur: 0.12, type: 'sine', gain: 0.5 },
    ],
  },
  alarm: {
    length: 0.7,
    notes: [
      { freq: 523, at: 0, dur: 0.14, type: 'square', gain: 0.25 },
      { freq: 415, at: 0.18, dur: 0.14, type: 'square', gain: 0.25 },
      { freq: 523, at: 0.36, dur: 0.14, type: 'square', gain: 0.25 },
      { freq: 415, at: 0.54, dur: 0.14, type: 'square', gain: 0.25 },
    ],
  },
  chime: {
    length: 0.9,
    notes: [
      { freq: 523, at: 0, dur: 0.4, type: 'sine', gain: 0.4 },
      { freq: 659, at: 0.25, dur: 0.4, type: 'sine', gain: 0.4 },
      { freq: 784, at: 0.5, dur: 0.4, type: 'sine', gain: 0.4 },
    ],
  },
  digital: {
    length: 0.5,
    notes: [
      { freq: 1000, at: 0, dur: 0.07, type: 'square', gain: 0.2 },
      { freq: 1000, at: 0.15, dur: 0.07, type: 'square', gain: 0.2 },
      { freq: 1000, at: 0.3, dur: 0.07, type: 'square', gain: 0.2 },
    ],
  },
}
let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function playNote(audio: AudioContext, note: Note, offset: number, volume: number) {
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  const start = audio.currentTime + offset + note.at
  osc.type = note.type
  osc.frequency.value = note.freq
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(note.gain * volume, start + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, start + note.dur)
  osc.connect(gain).connect(audio.destination)
  osc.start(start)
  osc.stop(start + note.dur + 0.05)
}

export function playAlarm(preset: SoundPreset, repeats: number, volume = 1) {
  const audio = getCtx()
  if (!audio) return
  const pattern = PATTERNS[preset]
  const vol = Math.min(1, Math.max(0, volume))
  for (let r = 0; r < Math.max(1, repeats); r++) {
    for (const note of pattern.notes) {
      playNote(audio, note, r * pattern.length, vol)
    }
  }
}
