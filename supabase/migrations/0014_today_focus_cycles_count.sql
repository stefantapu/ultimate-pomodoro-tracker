-- Make focus_cycles_count represent today's completed focus sessions.
-- Keep JSON key name unchanged to preserve frontend response shape.

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
      AND status IN ('completed', 'interrupted')
      AND started_at >= date_trunc('day', now());

    SELECT COALESCE(SUM(accumulated_seconds), 0) INTO v_today_break_time
    FROM public.focus_sessions
    WHERE user_id = target_user_id
      AND mode = 'break'
      AND status IN ('completed', 'interrupted')
      AND started_at >= date_trunc('day', now());

    SELECT count(*) INTO v_focus_cycles_count
    FROM public.focus_sessions
    WHERE user_id = target_user_id
      AND mode = 'focus'
      AND status = 'completed'
      AND started_at >= date_trunc('day', now());

    WITH dates AS (
        SELECT DISTINCT date_trunc('day', started_at)::date AS d
        FROM public.focus_sessions
        WHERE user_id = target_user_id
          AND mode = 'focus'
          AND status IN ('completed', 'interrupted')
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
          AND status IN ('completed', 'interrupted')
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
