-- History dashboard analytics and lightweight app visit tracking.

CREATE TABLE IF NOT EXISTS public.app_activity_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_id uuid NOT NULL,
  event_type text NOT NULL CHECK (
    event_type = ANY (
      ARRAY[
        'app_open'::text,
        'visibility_visible'::text
      ]
    )
  ),
  occurred_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT app_activity_events_pkey PRIMARY KEY (id),
  CONSTRAINT app_activity_events_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.app_activity_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own app activity" ON public.app_activity_events;
DROP POLICY IF EXISTS "Users can insert their own app activity" ON public.app_activity_events;

CREATE POLICY "Users can read their own app activity"
  ON public.app_activity_events
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own app activity"
  ON public.app_activity_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS focus_sessions_user_started_at_idx
  ON public.focus_sessions (user_id, started_at DESC);

CREATE INDEX IF NOT EXISTS focus_sessions_user_mode_status_started_idx
  ON public.focus_sessions (user_id, mode, status, started_at DESC);

CREATE INDEX IF NOT EXISTS app_activity_events_user_occurred_at_idx
  ON public.app_activity_events (user_id, occurred_at DESC);

CREATE OR REPLACE FUNCTION public.get_user_infographics(
  target_user_id uuid,
  anchor_date date,
  target_timezone text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  v_timezone text := COALESCE(NULLIF(target_timezone, ''), 'UTC');
  v_today date := (now() AT TIME ZONE COALESCE(NULLIF(target_timezone, ''), 'UTC'))::date;
  v_anchor_date date := COALESCE(anchor_date, (now() AT TIME ZONE COALESCE(NULLIF(target_timezone, ''), 'UTC'))::date);
  v_week_start date;
  v_week_end date;
  v_current_week_start date;
  v_current_week_end date;
  v_week_start_at timestamp with time zone;
  v_week_end_at timestamp with time zone;
  v_current_week_start_at timestamp with time zone;
  v_current_week_end_at timestamp with time zone;
  v_today_start_at timestamp with time zone;
  v_today_end_at timestamp with time zone;
  v_today_focus_time integer;
  v_current_week_focus_time integer;
  v_completed_cycles_count integer;
  v_interrupted_focus_time integer;
  v_total_focus_time integer;
  v_current_streak integer;
  v_weekly_days json;
  v_daypart_distribution json;
  v_visit_events json;
  v_visits_by_day json;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> target_user_id THEN
    RAISE EXCEPTION 'Not authorized to access infographics for this user'
      USING ERRCODE = '42501';
  END IF;

  v_week_start := v_anchor_date - (EXTRACT(ISODOW FROM v_anchor_date)::integer - 1);
  v_week_end := v_week_start + 6;
  v_current_week_start := v_today - (EXTRACT(ISODOW FROM v_today)::integer - 1);
  v_current_week_end := v_current_week_start + 6;

  v_week_start_at := v_week_start::timestamp AT TIME ZONE v_timezone;
  v_week_end_at := (v_week_end + 1)::timestamp AT TIME ZONE v_timezone;
  v_current_week_start_at := v_current_week_start::timestamp AT TIME ZONE v_timezone;
  v_current_week_end_at := (v_current_week_end + 1)::timestamp AT TIME ZONE v_timezone;
  v_today_start_at := v_today::timestamp AT TIME ZONE v_timezone;
  v_today_end_at := (v_today + 1)::timestamp AT TIME ZONE v_timezone;

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

  SELECT COALESCE(json_agg(
    json_build_object(
      'date', to_char(cal.calendar_date::date, 'YYYY-MM-DD'),
      'weekday', to_char(cal.calendar_date::date, 'Dy'),
      'focus_seconds', COALESCE(day_totals.focus_seconds, 0),
      'break_seconds', COALESCE(day_totals.break_seconds, 0),
      'completed_cycles', COALESCE(day_totals.completed_cycles, 0),
      'interrupted_focus_seconds', COALESCE(day_totals.interrupted_focus_seconds, 0)
    )
    ORDER BY cal.calendar_date ASC
  ), '[]'::json) INTO v_weekly_days
  FROM generate_series(v_week_start, v_week_end, '1 day'::interval) AS cal(calendar_date)
  LEFT JOIN (
    SELECT
      date_trunc('day', started_at AT TIME ZONE v_timezone)::date AS session_day,
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
      AND started_at >= v_week_start_at
      AND started_at < v_week_end_at
    GROUP BY 1
  ) day_totals ON cal.calendar_date::date = day_totals.session_day;

  SELECT COALESCE(json_agg(
    json_build_object(
      'label', bucket.label,
      'focus_seconds', COALESCE(daypart_totals.focus_seconds, 0)
    )
    ORDER BY bucket.position ASC
  ), '[]'::json) INTO v_daypart_distribution
  FROM (
    VALUES
      (1, 'Night', 0, 6),
      (2, 'Morning', 6, 12),
      (3, 'Afternoon', 12, 18),
      (4, 'Evening', 18, 24)
  ) AS bucket(position, label, start_hour, end_hour)
  LEFT JOIN (
    SELECT
      CASE
        WHEN EXTRACT(HOUR FROM started_at AT TIME ZONE v_timezone)::integer < 6 THEN 'Night'
        WHEN EXTRACT(HOUR FROM started_at AT TIME ZONE v_timezone)::integer < 12 THEN 'Morning'
        WHEN EXTRACT(HOUR FROM started_at AT TIME ZONE v_timezone)::integer < 18 THEN 'Afternoon'
        ELSE 'Evening'
      END AS label,
      SUM(accumulated_seconds) AS focus_seconds
    FROM public.focus_sessions
    WHERE user_id = target_user_id
      AND mode = 'focus'
      AND status IN ('completed', 'interrupted')
      AND started_at >= now() - interval '90 days'
    GROUP BY 1
  ) daypart_totals ON bucket.label = daypart_totals.label;

  SELECT COALESCE(json_agg(
    json_build_object(
      'id', events.id,
      'event_type', events.event_type,
      'occurred_at', events.occurred_at,
      'local_time', to_char(events.occurred_at AT TIME ZONE v_timezone, 'HH24:MI'),
      'local_date', to_char(events.occurred_at AT TIME ZONE v_timezone, 'YYYY-MM-DD')
    )
    ORDER BY events.occurred_at DESC
  ), '[]'::json) INTO v_visit_events
  FROM (
    SELECT *
    FROM public.app_activity_events
    WHERE user_id = target_user_id
      AND event_type IN ('app_open', 'visibility_visible')
    ORDER BY occurred_at DESC
    LIMIT 12
  ) events;

  SELECT COALESCE(json_agg(
    json_build_object(
      'date', to_char(cal.calendar_date::date, 'YYYY-MM-DD'),
      'visits', COALESCE(visit_totals.visits, 0)
    )
    ORDER BY cal.calendar_date ASC
  ), '[]'::json) INTO v_visits_by_day
  FROM generate_series(v_week_start, v_week_end, '1 day'::interval) AS cal(calendar_date)
  LEFT JOIN (
    SELECT
      date_trunc('day', occurred_at AT TIME ZONE v_timezone)::date AS event_day,
      COUNT(*) FILTER (WHERE event_type IN ('app_open', 'visibility_visible')) AS visits
    FROM public.app_activity_events
    WHERE user_id = target_user_id
      AND occurred_at >= v_week_start_at
      AND occurred_at < v_week_end_at
    GROUP BY 1
  ) visit_totals ON cal.calendar_date::date = visit_totals.event_day;

  result := json_build_object(
    'summary', json_build_object(
      'today_focus_time', v_today_focus_time,
      'current_week_focus_time', v_current_week_focus_time,
      'completed_cycles_count', v_completed_cycles_count,
      'interrupted_focus_time', v_interrupted_focus_time,
      'total_focus_time', v_total_focus_time,
      'current_streak', v_current_streak
    ),
    'week', json_build_object(
      'start_date', to_char(v_week_start, 'YYYY-MM-DD'),
      'end_date', to_char(v_week_end, 'YYYY-MM-DD'),
      'days', v_weekly_days
    ),
    'daypart_distribution', v_daypart_distribution,
    'visit_events', v_visit_events,
    'visits_by_day', v_visits_by_day
  );

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_user_infographics(uuid, date, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_infographics(uuid, date, text) TO authenticated;
