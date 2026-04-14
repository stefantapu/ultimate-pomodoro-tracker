ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS alarm_enabled boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS alarm_volume real NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS ui_volume real NOT NULL DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS focus_ambience_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS focus_ambience_volume real NOT NULL DEFAULT 0.2;
