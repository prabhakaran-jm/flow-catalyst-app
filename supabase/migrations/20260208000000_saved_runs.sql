-- Migration: Add saved_runs table for user-initiated "Save to library"
-- Supports both built-in coaches and custom catalysts

CREATE TABLE IF NOT EXISTS public.saved_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_name text NOT NULL,
  coach_id text NOT NULL,
  output text NOT NULL,
  inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.saved_runs IS 'User-saved run outputs (Save to library)';

CREATE INDEX IF NOT EXISTS idx_saved_runs_user_id ON public.saved_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_runs_created_at ON public.saved_runs(created_at DESC);

ALTER TABLE public.saved_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select their own saved runs"
  ON public.saved_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved runs"
  ON public.saved_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved runs"
  ON public.saved_runs FOR DELETE
  USING (auth.uid() = user_id);
