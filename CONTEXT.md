# Domain Context

This project is a gamified Pomodoro tracker. Use these terms when naming modules and tests.

## Terms

- **Timer settings**: focus duration, break duration, auto-start preferences, and audio preferences that control timer behavior.
- **Timer settings draft**: editable settings in the settings modal before they are saved.
- **Focus session**: a recorded focus or break run with intended duration, accumulated seconds, start time, and finish time.
- **Focus session ledger**: the module that decides which focus sessions are queued, flushed, and used to refresh analytics.
- **Authenticated resource**: Supabase-backed data that belongs to the signed-in user and must hide stale data when users change.
- **Skin profile**: a normalized theme description containing colors, typography, layout, assets, audio, cursors, and effects.
- **Skin definition**: the author-facing, possibly partial input used to build a skin profile.
