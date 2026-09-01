import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import type { Settings as AppSettings } from '@/hooks/useTimers'
import { playAlarm, SOUND_PRESETS, type SoundPreset } from '@/lib/sound'
import { Settings, Volume2 } from 'lucide-react'

interface SettingsDialogProps {
  settings: AppSettings
  onSettingsChange: (settings: AppSettings) => void
}

export function SettingsDialog({ settings, onSettingsChange }: SettingsDialogProps) {
  const set = (patch: Partial<AppSettings>) =>
    onSettingsChange({ ...settings, ...patch })

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Sound settings">
          <Settings aria-hidden />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Alarm settings</DialogTitle>
          <DialogDescription>
            Sound and repeats played when a timer finishes.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="sound-preset">Sound</Label>
            <Select
              value={settings.sound}
              onValueChange={(v) => set({ sound: v as SoundPreset })}
            >
              <SelectTrigger id="sound-preset" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOUND_PRESETS.map((preset) => (
                  <SelectItem key={preset} value={preset}>
                    {preset}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="sound-repeats">Repeats</Label>
              <span className="text-sm tabular-nums text-muted-foreground">
                {settings.repeats}x
              </span>
            </div>
            <Slider
              id="sound-repeats"
              min={1}
              max={10}
              step={1}
              value={[settings.repeats]}
              onValueChange={([v]) => set({ repeats: v })}
            />
          </div>

          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="sound-volume">Volume</Label>
              <span className="text-sm tabular-nums text-muted-foreground">
                {Math.round(settings.volume * 100)}%
              </span>
            </div>
            <Slider
              id="sound-volume"
              min={0}
              max={100}
              step={5}
              value={[Math.round(settings.volume * 100)]}
              onValueChange={([v]) => set({ volume: v / 100 })}
            />
          </div>

          <Button variant="outline" onClick={() => playAlarm(settings.sound, settings.repeats, settings.volume)}>
            <Volume2 data-icon="inline-start" aria-hidden />
            Test sound
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
