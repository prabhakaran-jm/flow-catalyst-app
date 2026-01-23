-- Migration: Initial schema for Flow Catalyst
-- Created: 2026-01-23
-- Description: Creates profiles and catalysts tables with Row Level Security policies

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
-- Stores user profile information linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  domain text,
  work_style text,
  values text[]
);

-- Add comment to table
COMMENT ON TABLE public.profiles IS 'User profiles with domain, work style, and values';

-- ============================================================================
-- CATALYSTS TABLE
-- ============================================================================
-- Stores Action Catalysts that users can create and run
CREATE TABLE IF NOT EXISTS public.catalysts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  inputs_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  prompt_template text NOT NULL,
  visibility text NOT NULL DEFAULT 'system' CHECK (visibility IN ('system', 'private', 'shared')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add comments to table and columns
COMMENT ON TABLE public.catalysts IS 'Action Catalysts that guide users through focused workflows';
COMMENT ON COLUMN public.catalysts.inputs_json IS 'Array of input descriptors defining what data the catalyst needs';
COMMENT ON COLUMN public.catalysts.prompt_template IS 'Template for generating the catalyst prompt';
COMMENT ON COLUMN public.catalysts.visibility IS 'system: visible to all, private: only owner, shared: shared with others';

-- Create index on owner_id for faster queries
CREATE INDEX IF NOT EXISTS idx_catalysts_owner_id ON public.catalysts(owner_id);

-- Create index on visibility for faster filtering
CREATE INDEX IF NOT EXISTS idx_catalysts_visibility ON public.catalysts(visibility);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on catalysts table
ALTER TABLE public.catalysts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES RLS POLICIES
-- ============================================================================

-- Policy: Users can select their own profile
CREATE POLICY "Users can select their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Users can insert their own profile (for initial creation)
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- CATALYSTS RLS POLICIES
-- ============================================================================

-- Policy: Users can select system catalysts (visibility = 'system')
CREATE POLICY "Anyone can select system catalysts"
  ON public.catalysts
  FOR SELECT
  USING (visibility = 'system');

-- Policy: Users can select their own catalysts
CREATE POLICY "Users can select their own catalysts"
  ON public.catalysts
  FOR SELECT
  USING (auth.uid() = owner_id);

-- Policy: Users can select shared catalysts (if needed in future)
-- Note: This allows selecting catalysts where visibility = 'shared'
-- You may want to add additional logic for sharing permissions later
CREATE POLICY "Users can select shared catalysts"
  ON public.catalysts
  FOR SELECT
  USING (visibility = 'shared');

-- Policy: Users can insert their own catalysts
CREATE POLICY "Users can insert their own catalysts"
  ON public.catalysts
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Policy: Users can update their own catalysts
CREATE POLICY "Users can update their own catalysts"
  ON public.catalysts
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Policy: Users can delete their own catalysts
CREATE POLICY "Users can delete their own catalysts"
  ON public.catalysts
  FOR DELETE
  USING (auth.uid() = owner_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS (Optional helpers)
-- ============================================================================

-- Function to automatically create a profile when a user signs up
-- This can be called from a database trigger or from your app
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user creation
-- Uncomment if you want automatic profile creation
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
