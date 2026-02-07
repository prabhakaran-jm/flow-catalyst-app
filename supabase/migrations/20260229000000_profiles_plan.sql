-- Add plan column to profiles for server-side Pro bypass (e.g. RevenueCat webhook)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free';

COMMENT ON COLUMN public.profiles.plan IS 'Subscription plan: free or pro. Set by RevenueCat webhook or manually for testing.';
