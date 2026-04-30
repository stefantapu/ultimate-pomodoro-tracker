-- Remove session status as a persisted concept while preserving recorded time.

DROP INDEX IF EXISTS public.focus_sessions_user_mode_status_started_idx;

CREATE INDEX IF NOT EXISTS focus_sessions_user_mode_started_idx
  ON public.focus_sessions (user_id, mode, started_at DESC);

CREATE OR REPLACE FUNCTION public.handle_focus_session_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_xp bigint;
    new_level integer;
BEGIN
    IF NEW.mode = 'focus'
       AND NEW.accumulated_seconds > 0 THEN
        UPDATE public.profiles
        SET total_xp = total_xp + NEW.accumulated_seconds
        WHERE id = NEW.user_id
        RETURNING total_xp INTO new_xp;

        IF FOUND THEN
            new_level := FLOOR(SQRT(new_xp / 100.0)) + 1;

            UPDATE public.profiles
            SET level = new_level
            WHERE id = NEW.user_id AND level != new_level;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

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
      AND accumulated_seconds > 0
      AND started_at >= date_trunc('day', now());

    SELECT COALESCE(SUM(accumulated_seconds), 0) INTO v_today_break_time
    FROM public.focus_sessions
    WHERE user_id = target_user_id
      AND mode = 'break'
      AND accumulated_seconds > 0
      AND started_at >= date_trunc('day', now());

    SELECT count(*) INTO v_focus_cycles_count
    FROM public.focus_sessions
    WHERE user_id = target_user_id
      AND mode = 'focus'
      AND accumulated_seconds >= duration_seconds
      AND started_at >= date_trunc('day', now());

    WITH dates AS (
        SELECT DISTINCT date_trunc('day', started_at)::date AS d
        FROM public.focus_sessions
        WHERE user_id = target_user_id
          AND mode = 'focus'
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
          AND accumulated_seconds > 0
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

CREATE OR REPLACE FUNCTION public.get_user_infographics(
  target_user_id uuid,
  anchor_date date,
  target_timezone text,
  period_mode text DEFAULT 'week'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  v_timezone text := COALESCE(NULLIF(target_timezone, ''), 'UTC');
  v_period_mode text := CASE
    WHEN lower(COALESCE(period_mode, 'week')) IN ('week', 'month', 'year')
      THEN lower(COALESCE(period_mode, 'week'))
    ELSE 'week'
  END;
  v_today date := (now() AT TIME ZONE COALESCE(NULLIF(target_timezone, ''), 'UTC'))::date;
  v_anchor_date date := COALESCE(anchor_date, (now() AT TIME ZONE COALESCE(NULLIF(target_timezone, ''), 'UTC'))::date);
  v_current_week_start date;
  v_current_week_end date;
  v_today_start_at timestamp with time zone;
  v_today_end_at timestamp with time zone;
  v_current_week_start_at timestamp with time zone;
  v_current_week_end_at timestamp with time zone;
  v_period_start date;
  v_period_end date;
  v_period_start_at timestamp with time zone;
  v_period_end_at timestamp with time zone;
  v_today_focus_time integer;
  v_current_week_focus_time integer;
  v_completed_cycles_count integer;
  v_total_focus_time integer;
  v_current_streak integer;
  v_active_days integer;
  v_focus_period json;
  v_hourly_distribution json;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> target_user_id THEN
    RAISE EXCEPTION 'Not authorized to access infographics for this user'
      USING ERRCODE = '42501';
  END IF;

  v_current_week_start := v_today - (EXTRACT(ISODOW FROM v_today)::integer - 1);
  v_current_week_end := v_current_week_start + 6;
  v_today_start_at := v_today::timestamp AT TIME ZONE v_timezone;
  v_today_end_at := (v_today + 1)::timestamp AT TIME ZONE v_timezone;
  v_current_week_start_at := v_current_week_start::timestamp AT TIME ZONE v_timezone;
  v_current_week_end_at := (v_current_week_end + 1)::timestamp AT TIME ZONE v_timezone;

  IF v_period_mode = 'year' THEN
    v_period_start := make_date(EXTRACT(YEAR FROM v_anchor_date)::integer, 1, 1);
    v_period_end := make_date(EXTRACT(YEAR FROM v_anchor_date)::integer, 12, 31);
  ELSIF v_period_mode = 'month' THEN
    v_period_start := date_trunc('month', v_anchor_date::timestamp)::date;
    v_period_end := (date_trunc('month', v_anchor_date::timestamp) + interval '1 month - 1 day')::date;
  ELSE
    v_period_start := v_anchor_date - (EXTRACT(ISODOW FROM v_anchor_date)::integer - 1);
    v_period_end := v_period_start + 6;
  END IF;

  v_period_start_at := v_period_start::timestamp AT TIME ZONE v_timezone;
  v_period_end_at := (v_period_end + 1)::timestamp AT TIME ZONE v_timezone;

  SELECT COALESCE(SUM(accumulated_seconds), 0) INTO v_today_focus_time
  FROM public.focus_sessions
  WHERE user_id = target_user_id
    AND mode = 'focus'
    AND accumulated_seconds > 0
    AND started_at >= v_today_start_at
    AND started_at < v_today_end_at;

  SELECT COALESCE(SUM(accumulated_seconds), 0) INTO v_current_week_focus_time
  FROM public.focus_sessions
  WHERE user_id = target_user_id
    AND mode = 'focus'
    AND accumulated_seconds > 0
    AND started_at >= v_current_week_start_at
    AND started_at < v_current_week_end_at;

  SELECT COUNT(*) INTO v_completed_cycles_count
  FROM public.focus_sessions
  WHERE user_id = target_user_id
    AND mode = 'focus'
    AND accumulated_seconds >= duration_seconds;

  SELECT COALESCE(SUM(accumulated_seconds), 0) INTO v_total_focus_time
  FROM public.focus_sessions
  WHERE user_id = target_user_id
    AND mode = 'focus'
    AND accumulated_seconds > 0;

  SELECT COUNT(DISTINCT date_trunc('day', started_at AT TIME ZONE v_timezone)::date)
  INTO v_active_days
  FROM public.focus_sessions
  WHERE user_id = target_user_id
    AND accumulated_seconds > 0;

  WITH dates AS (
    SELECT DISTINCT date_trunc('day', started_at AT TIME ZONE v_timezone)::date AS d
    FROM public.focus_sessions
    WHERE user_id = target_user_id
      AND mode = 'focus'
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
  WHERE end_date >= v_today - 1;

  IF v_period_mode = 'year' THEN
    SELECT json_build_object(
      'mode', v_period_mode,
      'start_date', to_char(v_period_start, 'YYYY-MM-DD'),
      'end_date', to_char(v_period_end, 'YYYY-MM-DD'),
      'buckets', COALESCE(json_agg(
        json_build_object(
          'date', to_char(buckets.bucket_start, 'YYYY-MM-DD'),
          'label', buckets.label,
          'focus_seconds', COALESCE(period_totals.focus_seconds, 0),
          'break_seconds', COALESCE(period_totals.break_seconds, 0),
          'completed_cycles', COALESCE(period_totals.completed_cycles, 0)
        )
        ORDER BY buckets.position ASC
      ), '[]'::json)
    ) INTO v_focus_period
    FROM (
      SELECT
        month_index AS position,
        make_date(EXTRACT(YEAR FROM v_period_start)::integer, month_index, 1) AS bucket_start,
        to_char(make_date(EXTRACT(YEAR FROM v_period_start)::integer, month_index, 1), 'Mon') AS label
      FROM generate_series(1, 12) AS month_index
    ) buckets
    LEFT JOIN (
      SELECT
        date_trunc('month', started_at AT TIME ZONE v_timezone)::date AS bucket_start,
        SUM(accumulated_seconds) FILTER (
          WHERE mode = 'focus' AND accumulated_seconds > 0
        ) AS focus_seconds,
        SUM(accumulated_seconds) FILTER (
          WHERE mode = 'break' AND accumulated_seconds > 0
        ) AS break_seconds,
        COUNT(*) FILTER (
          WHERE mode = 'focus' AND accumulated_seconds >= duration_seconds
        ) AS completed_cycles
      FROM public.focus_sessions
      WHERE user_id = target_user_id
        AND accumulated_seconds > 0
        AND started_at >= v_period_start_at
        AND started_at < v_period_end_at
      GROUP BY 1
    ) period_totals ON buckets.bucket_start = period_totals.bucket_start;
  ELSIF v_period_mode = 'month' THEN
    SELECT json_build_object(
      'mode', v_period_mode,
      'start_date', to_char(v_period_start, 'YYYY-MM-DD'),
      'end_date', to_char(v_period_end, 'YYYY-MM-DD'),
      'buckets', COALESCE(json_agg(
        json_build_object(
          'date', to_char(buckets.bucket_start, 'YYYY-MM-DD'),
          'label', buckets.label,
          'focus_seconds', COALESCE(period_totals.focus_seconds, 0),
          'break_seconds', COALESCE(period_totals.break_seconds, 0),
          'completed_cycles', COALESCE(period_totals.completed_cycles, 0)
        )
        ORDER BY buckets.position ASC
      ), '[]'::json)
    ) INTO v_focus_period
    FROM (
      SELECT
        week_index AS position,
        (v_period_start + (week_index * 7))::date AS bucket_start,
        'Week ' || (week_index + 1)::text AS label
      FROM generate_series(
        0,
        FLOOR(((v_period_end - v_period_start)::numeric) / 7)::integer
      ) AS week_index
    ) buckets
    LEFT JOIN (
      SELECT
        FLOOR(((date_trunc('day', started_at AT TIME ZONE v_timezone)::date - v_period_start)::numeric) / 7)::integer AS position,
        SUM(accumulated_seconds) FILTER (
          WHERE mode = 'focus' AND accumulated_seconds > 0
        ) AS focus_seconds,
        SUM(accumulated_seconds) FILTER (
          WHERE mode = 'break' AND accumulated_seconds > 0
        ) AS break_seconds,
        COUNT(*) FILTER (
          WHERE mode = 'focus' AND accumulated_seconds >= duration_seconds
        ) AS completed_cycles
      FROM public.focus_sessions
      WHERE user_id = target_user_id
        AND accumulated_seconds > 0
        AND started_at >= v_period_start_at
        AND started_at < v_period_end_at
      GROUP BY 1
    ) period_totals ON buckets.position = period_totals.position;
  ELSE
    SELECT json_build_object(
      'mode', v_period_mode,
      'start_date', to_char(v_period_start, 'YYYY-MM-DD'),
      'end_date', to_char(v_period_end, 'YYYY-MM-DD'),
      'buckets', COALESCE(json_agg(
        json_build_object(
          'date', to_char(buckets.bucket_start, 'YYYY-MM-DD'),
          'label', buckets.label,
          'focus_seconds', COALESCE(period_totals.focus_seconds, 0),
          'break_seconds', COALESCE(period_totals.break_seconds, 0),
          'completed_cycles', COALESCE(period_totals.completed_cycles, 0)
        )
        ORDER BY buckets.bucket_start ASC
      ), '[]'::json)
    ) INTO v_focus_period
    FROM (
      SELECT
        cal.calendar_date::date AS bucket_start,
        to_char(cal.calendar_date::date, 'Dy') AS label
      FROM generate_series(v_period_start, v_period_end, '1 day'::interval) AS cal(calendar_date)
    ) buckets
    LEFT JOIN (
      SELECT
        date_trunc('day', started_at AT TIME ZONE v_timezone)::date AS bucket_start,
        SUM(accumulated_seconds) FILTER (
          WHERE mode = 'focus' AND accumulated_seconds > 0
        ) AS focus_seconds,
        SUM(accumulated_seconds) FILTER (
          WHERE mode = 'break' AND accumulated_seconds > 0
        ) AS break_seconds,
        COUNT(*) FILTER (
          WHERE mode = 'focus' AND accumulated_seconds >= duration_seconds
        ) AS completed_cycles
      FROM public.focus_sessions
      WHERE user_id = target_user_id
        AND accumulated_seconds > 0
        AND started_at >= v_period_start_at
        AND started_at < v_period_end_at
      GROUP BY 1
    ) period_totals ON buckets.bucket_start = period_totals.bucket_start;
  END IF;

  SELECT COALESCE(json_agg(
    json_build_object(
      'hour', hours.hour,
      'focus_seconds', COALESCE(hourly_totals.focus_seconds, 0)
    )
    ORDER BY hours.hour ASC
  ), '[]'::json) INTO v_hourly_distribution
  FROM (
    SELECT generate_series(0, 23) AS hour
  ) hours
  LEFT JOIN (
    SELECT
      EXTRACT(HOUR FROM started_at AT TIME ZONE v_timezone)::integer AS hour,
      SUM(accumulated_seconds) AS focus_seconds
    FROM public.focus_sessions
    WHERE user_id = target_user_id
      AND mode = 'focus'
      AND accumulated_seconds > 0
      AND started_at >= v_period_start_at
      AND started_at < v_period_end_at
    GROUP BY 1
  ) hourly_totals ON hours.hour = hourly_totals.hour;

  result := json_build_object(
    'summary', json_build_object(
      'today_focus_time', v_today_focus_time,
      'current_week_focus_time', v_current_week_focus_time,
      'completed_cycles_count', v_completed_cycles_count,
      'total_focus_time', v_total_focus_time,
      'current_streak', v_current_streak,
      'active_days', v_active_days
    ),
    'focus_period', v_focus_period,
    'hourly_distribution', v_hourly_distribution
  );

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_user_infographics(uuid, date, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_infographics(uuid, date, text, text) TO authenticated;

DROP FUNCTION IF EXISTS public.get_user_infographics(uuid, date, text);

ALTER TABLE public.focus_sessions
  DROP COLUMN IF EXISTS status;
