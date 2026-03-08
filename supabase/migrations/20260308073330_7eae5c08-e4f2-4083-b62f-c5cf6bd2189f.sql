ALTER TABLE public.events 
  ADD COLUMN prize_pool text,
  ADD COLUMN prizes jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN sponsors text[] DEFAULT '{}'::text[];