-- Add privacy settings columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS show_email BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_clubs BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_events BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_achievements BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'members', 'private'));