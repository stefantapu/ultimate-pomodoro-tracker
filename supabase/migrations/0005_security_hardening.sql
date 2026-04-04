-- Security hardening for production:
-- 1. Ensure every auth user gets a profile row.
-- 2. Lock down direct table access with RLS.
-- 3. Prevent analytics RPC from reading another user's data.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, level, total_xp)
  VALUES (NEW.id, 1, 0)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (id, level, total_xp)
SELECT users.id, 1, 0
FROM auth.users AS users
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can read their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can read their own sessions" ON public.focus_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.focus_sessions;

CREATE POLICY "Users can read their own sessions"
  ON public.focus_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON public.focus_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_user_analytics(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result json;
    v_today_focus_time integer;
    v_today_break_time integer;
    v_focus_cycles_count integer;
    v_current_streak integer;
    v_heatmap_data json;
BEGIN
    IF auth.uid() IS NULL OR auth.uid() <> target_user_id THEN
        RAISE EXCEPTION 'Not authorized to access analytics for this user'
            USING ERRCODE = '42501';
    END IF;

    SELECT COALESCE(SUM(accumulated_seconds), 0) INTO v_today_focus_time
    FROM public.focus_sessions
    WHERE user_id = target_user_id
      AND mode = 'focus'
      AND status = 'completed'
      AND started_at >= date_trunc('day', now());

    SELECT COALESCE(SUM(accumulated_seconds), 0) INTO v_today_break_time
    FROM public.focus_sessions
    WHERE user_id = target_user_id
      AND mode = 'break'
      AND (status = 'completed' OR status = 'interrupted')
      AND started_at >= date_trunc('day', now());

    SELECT count(*) INTO v_focus_cycles_count
    FROM public.focus_sessions
    WHERE user_id = target_user_id
      AND mode = 'focus'
      AND status = 'completed';

    WITH dates AS (
        SELECT DISTINCT date_trunc('day', started_at)::date AS d
        FROM public.focus_sessions
        WHERE user_id = target_user_id
          AND mode = 'focus'
          AND status = 'completed'
          AND accumulated_seconds > 0
    ),
    groups AS (
        SELECT d, d - ROW_NUMBER() OVER (ORDER BY d)::integer AS grp
        FROM dates
    ),
    streaks AS (
        SELECT grp, COUNT(*) AS streak_length, MAX(d) AS end_date
        FROM groups
        GROUP BY grp
    )
    SELECT COALESCE(MAX(streak_length), 0) INTO v_current_streak
    FROM streaks
    WHERE end_date >= current_date - interval '1 day';

    IF v_current_streak IS NULL THEN
        v_current_streak := 0;
    END IF;

    SELECT COALESCE(json_agg(
        json_build_object(
            'date', to_char(cal.calendar_date, 'YYYY-MM-DD'),
            'value', COALESCE(heatmap.total_seconds, 0)
        ) ORDER BY cal.calendar_date ASC
    ), '[]'::json) INTO v_heatmap_data
    FROM (
        SELECT generate_series(
            date_trunc('day', now() - interval '182 days')::date,
            date_trunc('day', now())::date,
            '1 day'::interval
        )::date AS calendar_date
    ) cal
    LEFT JOIN (
        SELECT date_trunc('day', started_at)::date AS session_day,
               SUM(accumulated_seconds) AS total_seconds
        FROM public.focus_sessions
        WHERE user_id = target_user_id
          AND mode = 'focus'
          AND status = 'completed'
          AND started_at >= now() - interval '182 days'
        GROUP BY 1
    ) heatmap ON cal.calendar_date = heatmap.session_day;

    result := json_build_object(
        'today_focus_time', v_today_focus_time,
        'today_break_time', v_today_break_time,
        'focus_cycles_count', v_focus_cycles_count,
        'current_streak', v_current_streak,
        'heatmap_data', v_heatmap_data
    );

    RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_user_analytics(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_analytics(uuid) TO authenticated;
