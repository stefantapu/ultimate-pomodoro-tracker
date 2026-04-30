-- Remove the obsolete 3-argument infographics RPC that referenced focus_sessions.status.

DROP FUNCTION IF EXISTS public.get_user_infographics(uuid, date, text);
