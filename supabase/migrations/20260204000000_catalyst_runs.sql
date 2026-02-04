-- Migration: Add catalyst_runs table for run history
-- Created: 2026-02-04
-- Description: Stores catalyst run outputs for history and analytics

-- ============================================================================
-- CATALYST_RUNS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.catalyst_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalyst_id uuid NOT NULL REFERENCES public.catalysts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  output text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.catalyst_runs IS 'History of catalyst runs for each user';

CREATE INDEX IF NOT EXISTS idx_catalyst_runs_user_id ON public.catalyst_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_catalyst_runs_catalyst_id ON public.catalyst_runs(catalyst_id);
CREATE INDEX IF NOT EXISTS idx_catalyst_runs_created_at ON public.catalyst_runs(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.catalyst_runs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own runs
CREATE POLICY "Users can select their own runs"
  ON public.catalyst_runs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Inserts are done by Edge Function with service role (bypasses RLS)
