-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.focus_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mode text NOT NULL CHECK (mode = ANY (ARRAY['focus'::text, 'break'::text])),
  status text NOT NULL CHECK (status = ANY (ARRAY['completed'::text, 'interrupted'::text])),
  duration_seconds integer NOT NULL,
  accumulated_seconds integer NOT NULL,
  started_at timestamp with time zone NOT NULL,
  finished_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT focus_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT focus_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  display_name text,
  total_xp bigint NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  focus_duration integer NOT NULL DEFAULT 1500,
  break_duration integer NOT NULL DEFAULT 300,
  auto_break boolean NOT NULL DEFAULT false,
  auto_focus boolean NOT NULL DEFAULT false,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);