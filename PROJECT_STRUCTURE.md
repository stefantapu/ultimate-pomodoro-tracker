# Project Structure

This file is a quick map of the repository so navigation is faster.

## Root

- `src/` app source code
- `public/` static assets (theme images, fonts, sounds)
- `supabase/migrations/` database schema migrations
- `utils/supabase.ts` Supabase client setup
- `package.json` scripts + dependencies
- `vite.config.ts` Vite config + path aliases

## Source (`src/`)

### App bootstrap

- `src/main.tsx` React entrypoint
- `src/app/App.tsx` top-level app shell
- `src/app/providers/AuthProvider.tsx` auth context/provider

### UI widgets (`src/widgets/`)

- `DashboardLayout.tsx` main dashboard composition
- `TimerBlock.tsx` timer feature composition (controls + timer + actions)
- `TimerCard.tsx` timer display panel
- `TopControls.tsx` focus/break mode and durations
- `ActionButtons.tsx` start/reset/auto/sound controls
- `NotesPanel.tsx` notes notepad panel
- `HeatmapCard.tsx`, `StatsCard.tsx`, `DragonCard.tsx` analytics/game panels
- `SettingsButton.tsx`, `SettingsModal.tsx` skin selector entry + modal
- `LogoutButton.tsx`, `AuthBlock.tsx`, `LockedOverlay.tsx` auth-gated UI pieces
- `PanelShell.tsx`, `ThemedButton.tsx` reusable UI primitives
- `dashboard.css` dashboard + skin-aware styling

### Shared logic (`src/shared/`)

#### Hooks (`src/shared/hooks/`)

- `usePomodoroTimer.ts` timer runtime logic
- `useAlarm.ts` alarm sound behavior
- `useSettingsSync.ts` timer settings cloud sync
- `useNotes.ts` notes CRUD/sync behavior
- `useAnalytics.ts`, `useProfile.ts`, `useSyncSession.ts` analytics/profile/session updates

#### Timer core (`src/shared/lib/`)

- `timerTypes.ts` timer type definitions
- `timerStorage.ts` localStorage read/write helpers
- `timerReducer.ts` timer reducer/state transitions

#### Stores (`src/shared/stores/`)

- `uiStore.ts` UI modal/trigger state
- `skinStore.ts` active skin state + persistence

#### Skin system (`src/shared/skins/`)

- `types.ts` skin contracts/types
- `catalog.ts` skin profiles (minimal + warm)
- `assetUtils.ts` asset dimension parser (`_w###_h###`)
- `cssVars.ts` skin -> CSS variable mapping

## Public assets (`public/`)

- `public/assets/red_lava_theme/` warm theme images/fonts
- `public/sounds/alarm.mp3` timer alarm
- `public/images/` app favicon images

### Red Lava theme assets

- timer panel: `public/assets/red_lava_theme/timer_panel_w1047_h390.webp`
- controls: `start_button_w321_h107.webp`, `reset_button_w321_h107.webp`, `auto_focus_w150_h150.webp`, `auto_break_w150_h150.webp`, `audio_button_w150_h150.webp`
- page background: `public/assets/red_lava_theme/background.webp`
- notes panel: `public/assets/red_lava_theme/notes_panel/notes_panel_w545_h717.webp`
- timer font: `public/assets/red_lava_theme/Fonts/timer numbres font/almendra.regular.ttf`

## Database migrations (`supabase/migrations/`)

- `0000_base_structure.sql` base schema
- `0002_add_timer_settings.sql` timer settings schema changes
- `0003_gamification_and_notes.sql` gamification + notes tables/features
- `0004_reduce_heatmap_window.sql` heatmap-related change

## Current navigation hints

- Start from `DashboardLayout.tsx` to understand page composition.
- Follow `TimerBlock.tsx` for timer behavior and controls.
- Follow `catalog.ts` + `dashboard.css` for skin/theming behavior.
- Follow `useNotes.ts` + `NotesPanel.tsx` for notes behavior.

## Common edit paths

### Change timer behavior (logic/state)

- `src/widgets/TimerBlock.tsx` integration flow for timer settings + actions
- `src/shared/hooks/usePomodoroTimer.ts` runtime timer behavior
- `src/shared/lib/timerReducer.ts` timer state transitions
- `src/shared/lib/timerStorage.ts` local persistence behavior

### Change timer visuals (theme/UI only)

- `src/widgets/TimerCard.tsx` timer display markup
- `src/widgets/ActionButtons.tsx` start/reset/auto/sound control markup
- `src/widgets/dashboard.css` timer + controls styling
- `src/shared/skins/catalog.ts` theme asset and color values
- `src/shared/skins/cssVars.ts` CSS variable mapping for skins

### Add or update a skin

- `src/shared/skins/types.ts` skin schema/types
- `src/shared/skins/catalog.ts` new skin profile definition
- `src/shared/skins/assetUtils.ts` asset dimension parsing (`_w###_h###`)
- `src/shared/skins/cssVars.ts` expose new token variables
- `src/shared/stores/skinStore.ts` persisted active skin state
- `src/widgets/SettingsModal.tsx` skin selection UI

### Change notes behavior

- `src/widgets/NotesPanel.tsx` notes UI and input/save interaction
- `src/shared/hooks/useNotes.ts` notes CRUD and DB sync
- `src/widgets/dashboard.css` notes panel visual behavior (minimal + warm)
- `supabase/migrations/0003_gamification_and_notes.sql` notes table schema

### Change dashboard layout/composition

- `src/widgets/DashboardLayout.tsx` placement/order of panels
- `src/widgets/dashboard.css` grid, column sizing, responsive breakpoints

### Change authentication flow/UI

- `src/app/providers/AuthProvider.tsx` auth context/session handling
- `src/widgets/AuthBlock.tsx` login/signup modal
- `src/widgets/LogoutButton.tsx` login/logout entry point
- `src/shared/stores/uiStore.ts` auth/settings modal open state

### Change analytics/profile cards

- `src/shared/hooks/useAnalytics.ts` dashboard metrics fetch
- `src/shared/hooks/useProfile.ts` profile fetch and level data
- `src/widgets/HeatmapCard.tsx` heatmap rendering
- `src/widgets/StatsCard.tsx` daily stats rendering
- `src/widgets/DragonCard.tsx` level/xp card rendering

Related docs:

- docs/STYLING_REFACTOR_PLAN.md — styling/theming migration plan and rules
