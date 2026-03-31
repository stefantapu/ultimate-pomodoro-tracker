-- 1. XP AUTO-CALCULATION TRIGGER

-- Create the trigger function for updating XP and Level
CREATE OR REPLACE FUNCTION public.handle_focus_session_completed()
RETURNS TRIGGER AS $$
DECLARE
    new_xp bigint;
    new_level integer;
BEGIN
    IF NEW.mode = 'focus' AND NEW.status = 'completed' THEN
        -- Add accumulated_seconds to total_xp (1 second = 1 XP)
        UPDATE public.profiles
        SET total_xp = total_xp + NEW.accumulated_seconds
        WHERE id = NEW.user_id
        RETURNING total_xp INTO new_xp;
        
        IF FOUND THEN
            -- Calculate new level based on formula: Level = floor(sqrt(total_xp / 100)) + 1
            new_level := FLOOR(SQRT(new_xp / 100.0)) + 1;
            
            -- Update level if changed
            UPDATE public.profiles
            SET level = new_level
            WHERE id = NEW.user_id AND level != new_level;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Map the function to a trigger on focus_sessions insertions
DROP TRIGGER IF EXISTS on_focus_session_completed ON public.focus_sessions;
CREATE TRIGGER on_focus_session_completed
    AFTER INSERT ON public.focus_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_focus_session_completed();


-- 2. QUICK NOTES TABLE (Array of sticky notes)

CREATE TABLE IF NOT EXISTS public.notes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    content text NOT NULL DEFAULT '',
    is_completed boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT notes_pkey PRIMARY KEY (id),
    CONSTRAINT notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- RLS Policies for Notes
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notes" 
    ON public.notes 
    FOR ALL 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);


-- 3. ANALYTICS API RPC (get_user_analytics)

CREATE OR REPLACE FUNCTION public.get_user_analytics(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Secure against search_path hijacking
AS $$
DECLARE
    result json;
    v_today_focus_time integer;
    v_today_break_time integer;
    v_focus_cycles_count integer;
    v_current_streak integer;
    v_heatmap_data json;
BEGIN
    -- 1. Today Focus Time (Sum of seconds for today)
    SELECT COALESCE(SUM(accumulated_seconds), 0) INTO v_today_focus_time
    FROM public.focus_sessions
    WHERE user_id = target_user_id
      AND mode = 'focus'
      AND status = 'completed'
      AND started_at >= date_trunc('day', now());

    -- 2. Today Break Time (Sum of seconds for today)
    SELECT COALESCE(SUM(accumulated_seconds), 0) INTO v_today_break_time
    FROM public.focus_sessions
    WHERE user_id = target_user_id
      AND mode = 'break'
      AND (status = 'completed' OR status = 'interrupted') -- breaks might just be interrupted when stopping
      AND started_at >= date_trunc('day', now());

    -- 3. Focus Cycles Count (Total number of completed focus sessions)
    SELECT count(*) INTO v_focus_cycles_count
    FROM public.focus_sessions
    WHERE user_id = target_user_id
      AND mode = 'focus'
      AND status = 'completed';

    -- 4. Current Streak (Consecutive days with at least one focus session)
    WITH dates AS (
        SELECT DISTINCT date_trunc('day', started_at)::date as d
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
        SELECT grp, COUNT(*) as streak_length, MAX(d) as end_date
        FROM groups
        GROUP BY grp
    )
    SELECT COALESCE(MAX(streak_length), 0) INTO v_current_streak
    FROM streaks
    -- A streak is current if the end_date is today or yesterday
    WHERE end_date >= current_date - interval '1 day';

    IF v_current_streak IS NULL THEN
        v_current_streak := 0;
    END IF;

    -- 5. Heatmap Data (Last 365 days)
    SELECT COALESCE(json_agg(
        json_build_object(
            'date', to_char(session_day, 'YYYY-MM-DD'),
            'value', total_seconds
        )
    ), '[]'::json) INTO v_heatmap_data
    FROM (
        SELECT date_trunc('day', started_at)::date as session_day,
               SUM(accumulated_seconds) as total_seconds
        FROM public.focus_sessions
        WHERE user_id = target_user_id
          AND mode = 'focus'
          AND status = 'completed'
          AND started_at >= now() - interval '365 days'
        GROUP BY 1
        ORDER BY 1 ASC
    ) heatmap;

    -- Return JSON payload
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
