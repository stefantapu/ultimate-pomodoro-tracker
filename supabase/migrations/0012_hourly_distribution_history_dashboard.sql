-- Replace daypart buckets with a 24-hour focus histogram for the selected period.

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
  v_interrupted_focus_time integer;
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
    v_period_start := v_anchor_date - (EXTRACT(ISODOW FROM v_anchor_date)::integer - 1);
    v_period_end := v_period_start + 27;
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
    AND status IN ('completed', 'interrupted')
    AND started_at >= v_today_start_at
    AND started_at < v_today_end_at;

  SELECT COALESCE(SUM(accumulated_seconds), 0) INTO v_current_week_focus_time
  FROM public.focus_sessions
  WHERE user_id = target_user_id
    AND mode = 'focus'
    AND status IN ('completed', 'interrupted')
    AND started_at >= v_current_week_start_at
    AND started_at < v_current_week_end_at;

  SELECT COUNT(*) INTO v_completed_cycles_count
  FROM public.focus_sessions
  WHERE user_id = target_user_id
    AND mode = 'focus'
    AND status = 'completed';

  SELECT COALESCE(SUM(accumulated_seconds), 0) INTO v_interrupted_focus_time
  FROM public.focus_sessions
  WHERE user_id = target_user_id
    AND mode = 'focus'
    AND status = 'interrupted';

  SELECT COALESCE(SUM(accumulated_seconds), 0) INTO v_total_focus_time
  FROM public.focus_sessions
  WHERE user_id = target_user_id
    AND mode = 'focus'
    AND status IN ('completed', 'interrupted');

  SELECT COUNT(DISTINCT date_trunc('day', started_at AT TIME ZONE v_timezone)::date)
  INTO v_active_days
  FROM public.focus_sessions
  WHERE user_id = target_user_id
    AND status IN ('completed', 'interrupted')
    AND accumulated_seconds > 0;

  WITH dates AS (
    SELECT DISTINCT date_trunc('day', started_at AT TIME ZONE v_timezone)::date AS d
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
          'completed_cycles', COALESCE(period_totals.completed_cycles, 0),
          'interrupted_focus_seconds', COALESCE(period_totals.interrupted_focus_seconds, 0)
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
          WHERE mode = 'focus' AND status IN ('completed', 'interrupted')
        ) AS focus_seconds,
        SUM(accumulated_seconds) FILTER (
          WHERE mode = 'break' AND status IN ('completed', 'interrupted')
        ) AS break_seconds,
        COUNT(*) FILTER (
          WHERE mode = 'focus' AND status = 'completed'
        ) AS completed_cycles,
        SUM(accumulated_seconds) FILTER (
          WHERE mode = 'focus' AND status = 'interrupted'
        ) AS interrupted_focus_seconds
      FROM public.focus_sessions
      WHERE user_id = target_user_id
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
          'completed_cycles', COALESCE(period_totals.completed_cycles, 0),
          'interrupted_focus_seconds', COALESCE(period_totals.interrupted_focus_seconds, 0)
        )
        ORDER BY buckets.position ASC
      ), '[]'::json)
    ) INTO v_focus_period
    FROM (
      SELECT
        week_index AS position,
        v_period_start + (week_index * 7) AS bucket_start,
        'Week ' || (week_index + 1)::text AS label
      FROM generate_series(0, 3) AS week_index
    ) buckets
    LEFT JOIN (
      SELECT
        FLOOR(((date_trunc('day', started_at AT TIME ZONE v_timezone)::date - v_period_start)::numeric) / 7)::integer AS position,
        SUM(accumulated_seconds) FILTER (
          WHERE mode = 'focus' AND status IN ('completed', 'interrupted')
        ) AS focus_seconds,
        SUM(accumulated_seconds) FILTER (
          WHERE mode = 'break' AND status IN ('completed', 'interrupted')
        ) AS break_seconds,
        COUNT(*) FILTER (
          WHERE mode = 'focus' AND status = 'completed'
        ) AS completed_cycles,
        SUM(accumulated_seconds) FILTER (
          WHERE mode = 'focus' AND status = 'interrupted'
        ) AS interrupted_focus_seconds
      FROM public.focus_sessions
      WHERE user_id = target_user_id
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
          'completed_cycles', COALESCE(period_totals.completed_cycles, 0),
          'interrupted_focus_seconds', COALESCE(period_totals.interrupted_focus_seconds, 0)
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
          WHERE mode = 'focus' AND status IN ('completed', 'interrupted')
        ) AS focus_seconds,
        SUM(accumulated_seconds) FILTER (
          WHERE mode = 'break' AND status IN ('completed', 'interrupted')
        ) AS break_seconds,
        COUNT(*) FILTER (
          WHERE mode = 'focus' AND status = 'completed'
        ) AS completed_cycles,
        SUM(accumulated_seconds) FILTER (
          WHERE mode = 'focus' AND status = 'interrupted'
        ) AS interrupted_focus_seconds
      FROM public.focus_sessions
      WHERE user_id = target_user_id
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
      AND status IN ('completed', 'interrupted')
      AND started_at >= v_period_start_at
      AND started_at < v_period_end_at
    GROUP BY 1
  ) hourly_totals ON hours.hour = hourly_totals.hour;

  result := json_build_object(
    'summary', json_build_object(
      'today_focus_time', v_today_focus_time,
      'current_week_focus_time', v_current_week_focus_time,
      'completed_cycles_count', v_completed_cycles_count,
      'interrupted_focus_time', v_interrupted_focus_time,
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
