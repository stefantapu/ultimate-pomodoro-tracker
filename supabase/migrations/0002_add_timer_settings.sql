-- Add persistent setting columns to public.profiles

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS focus_duration integer NOT NULL DEFAULT 1500,
ADD COLUMN IF NOT EXISTS break_duration integer NOT NULL DEFAULT 300,
ADD COLUMN IF NOT EXISTS auto_break boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_focus boolean NOT NULL DEFAULT false;

-- To sync with the new default, you may want to update the trigger handle_new_user()
-- to explicitly insert these if you were passing explicit values, but since they have DEFAULTS,
-- the trigger code INSERT INTO public.profiles (id, level, total_xp) VALUES (new.id, 1, 0)
-- will automatically populate the new timer constants out-of-the-box.
