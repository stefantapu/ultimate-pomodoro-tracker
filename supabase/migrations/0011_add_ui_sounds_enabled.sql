ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS ui_sounds_enabled boolean NOT NULL DEFAULT true;
