# Dope Countdowns

Web-only countdown timer app (React 19 SPA). Dark-only UI, JetBrains Mono, palette from the portfolio app. No backend, no i18n (en-US only).

## Commands

- `npm run dev` — Vite dev server
- `npm run build` — typecheck + production build
- `npm run lint` — oxlint
- `npm test` — Vitest unit tests (jsdom + Testing Library)
- `npm run test:e2e` — Playwright e2e (starts dev server automatically)

## Structure

- `src/lib/timers.ts` — pure timer engine: lifecycle (start/pause/resume/finish/duplicate), wall-clock math, time-mask parsing/formatting, suggestion ranking. "Finished" is always derived from `endsAt <= now`, never stored.
- `src/lib/sound.ts` — Web Audio synthesized alarm presets (no audio assets, no deps).
- `src/hooks/useTimers.ts` — state owner: timers/usage/settings via `use-local-storage` (keys `dope-countdowns:*`), 250ms tick while any timer runs, fires alarm on session finishes only.
- `src/components/` — `TimeInput` (Google-style append mask), `TimerCard`, `NewTimerForm`, `SettingsDialog`; `ui/` is shadcn/ui (Radix, installed via `npx shadcn@latest add <name>`, style `new-york`).
- `e2e/` — Playwright specs.

## Conventions

- Tailwind v4 CSS-first; tokens live in `@theme`/`:root` in `src/index.css`. No tailwind.config. Extend tokens, don't hardcode hex.
- Import alias `@/*` → `./src/*`.
- `use-local-storage` is CJS-only; keep the default-export unwrap in `useTimers.ts` (rolldown-vite doesn't unwrap it).
