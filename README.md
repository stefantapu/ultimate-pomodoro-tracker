# Ultimate Pomodoro Tracker

A gamified Pomodoro timer built with React, TypeScript, Vite, and Supabase.

The app combines a focus timer, break timer, persistent settings, notes, session analytics, streaks, XP/level progression, and a skin-aware dashboard UI. Guests can use the timer locally, while signed-in users unlock cloud sync, notes, analytics, and long-term progress tracking.

## Features

- Focus and break timer with editable durations
- Local persistence for timer state and user settings
- Email/password authentication with Supabase Auth
- Cloud sync for timer settings
- Notes panel backed by Supabase
- Session tracking for focus and break runs
- Dashboard analytics powered by a Supabase RPC
- XP and level progression based on completed focus time
- Skin-aware UI with a themed "warm" dashboard

## Tech Stack

- React 19
- TypeScript
- Vite
- Zustand
- Supabase
- Sonner
- Day.js

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Create `.env.local`

The app expects Supabase credentials in `utils/supabase.ts`.

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_anon_key
```

If these values are missing, the app will fail on startup.

### 3. Prepare Supabase

This project depends on:

- Supabase Auth
- `profiles` table
- `focus_sessions` table
- `notes` table
- `get_user_analytics(uuid)` RPC
- the XP/level trigger for completed focus sessions

SQL migrations live in [`supabase/migrations/`](./supabase/migrations):

- `0000_base_structure.sql`
- `0002_add_timer_settings.sql`
- `0003_gamification_and_notes.sql`
- `0004_reduce_heatmap_window.sql`

Apply them in your Supabase project before testing authenticated features. If you use the Supabase CLI in your own environment, you can push these migrations from the repository; otherwise, run the SQL manually in the Supabase dashboard.

### 4. Start the app

```bash
npm run dev
```

Open the local Vite URL shown in the terminal.

## Available Scripts

- `npm run dev` starts the development server
- `npm run build` runs TypeScript build checks and creates a production bundle
- `npm run lint` runs ESLint
- `npm run preview` serves the production build locally

## How the App Works

### Timer

The timer supports two modes:

- `focus`
- `break`

Timer state is persisted locally so reloads do not immediately lose progress. Duration settings are also stored locally and, for authenticated users, synced back to the `profiles` row in Supabase.

### Auth and Locked Features

Guests can access the main dashboard shell and timer, but several panels are locked behind sign-in:

- notes
- analytics
- streak/progress data
- long-term XP and level tracking

Authentication is implemented with Supabase email/password auth.

### Analytics and Progression

Completed sessions are stored in `focus_sessions`. Authenticated dashboards then use the `get_user_analytics` RPC to load:

- focus time for today
- break time for today
- today completed focus cycle count
- current streak
- heatmap data

XP and level progression are updated in the database through a trigger when a completed focus session is inserted.

## Project Structure

High-level map:

- `src/app/` application bootstrap and providers
- `src/widgets/` UI components and dashboard composition
- `src/shared/hooks/` data fetching, timer, sync, and profile logic
- `src/shared/lib/` timer reducer, storage helpers, and shared types
- `src/shared/stores/` Zustand UI and skin state
- `src/shared/skins/` skin definitions and CSS variable mapping
- `public/` static assets, theme art, fonts, and sounds
- `supabase/migrations/` database schema and RPC migrations
- `utils/supabase.ts` Supabase client setup

For a more detailed code map, see [`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md).

## Important Files

- [`src/widgets/DashboardLayout.tsx`](./src/widgets/DashboardLayout.tsx): main dashboard composition
- [`src/widgets/TimerBlock.tsx`](./src/widgets/TimerBlock.tsx): timer orchestration and duration editing
- [`src/shared/hooks/usePomodoroTimer.ts`](./src/shared/hooks/usePomodoroTimer.ts): timer runtime behavior
- [`src/shared/hooks/useSettingsSync.ts`](./src/shared/hooks/useSettingsSync.ts): local/cloud settings sync
- [`src/shared/hooks/useNotes.ts`](./src/shared/hooks/useNotes.ts): notes CRUD
- [`src/shared/hooks/useAnalytics.ts`](./src/shared/hooks/useAnalytics.ts): analytics loading
- [`src/shared/skins/catalog.ts`](./src/shared/skins/catalog.ts): available skins
- [`src/widgets/dashboard.css`](./src/widgets/dashboard.css): dashboard styling

## Build Notes

- The project currently uses `npm` and ships a `package-lock.json`
- Environment files such as `.env.local` are gitignored
- There is no dedicated automated test suite configured yet, so `npm run build` and `npm run lint` are the main validation steps

## Future README Improvements

Good next additions, if you want this repo to feel more polished publicly:

- screenshots or GIFs of the dashboard
- a hosted demo link
- an `.env.example`
- Supabase setup instructions with exact SQL/bootstrap order
- contribution guidelines
- deployment instructions
