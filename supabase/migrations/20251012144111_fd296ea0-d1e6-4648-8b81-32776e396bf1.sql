-- Add CHECK constraint to validate profile_visibility values
ALTER TABLE public.profiles 
ADD CONSTRAINT profile_visibility_check 
CHECK (profile_visibility IN ('public', 'members', 'private'));