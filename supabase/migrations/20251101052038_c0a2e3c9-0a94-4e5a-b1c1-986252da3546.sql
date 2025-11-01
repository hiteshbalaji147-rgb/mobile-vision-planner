-- Create club role types
CREATE TYPE public.club_role AS ENUM ('president', 'secretary', 'member', 'faculty_coordinator');

-- Create club_roles table for granular permissions
CREATE TABLE public.club_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role club_role NOT NULL DEFAULT 'member',
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(club_id, user_id)
);

-- Enable RLS
ALTER TABLE public.club_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check club role
CREATE OR REPLACE FUNCTION public.has_club_role(_user_id UUID, _club_id UUID, _role club_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.club_roles
    WHERE user_id = _user_id 
      AND club_id = _club_id 
      AND role = _role
  )
$$;

-- Function to check if user has any leadership role in club
CREATE OR REPLACE FUNCTION public.is_club_admin(_user_id UUID, _club_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.club_roles
    WHERE user_id = _user_id 
      AND club_id = _club_id 
      AND role IN ('president', 'secretary', 'faculty_coordinator')
  )
$$;

-- RLS policies for club_roles
CREATE POLICY "Club roles are viewable by club members"
  ON public.club_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_id = club_roles.club_id 
        AND user_id = auth.uid()
        AND status = 'active'
    )
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Club admins can assign roles"
  ON public.club_roles FOR INSERT
  WITH CHECK (
    is_club_admin(auth.uid(), club_id) 
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Club admins can update roles"
  ON public.club_roles FOR UPDATE
  USING (
    is_club_admin(auth.uid(), club_id) 
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Club admins can remove roles"
  ON public.club_roles FOR DELETE
  USING (
    is_club_admin(auth.uid(), club_id) 
    OR has_role(auth.uid(), 'admin')
  );

-- Add calendar sync fields to events
ALTER TABLE public.events 
ADD COLUMN google_calendar_id TEXT,
ADD COLUMN outlook_event_id TEXT;

-- Create analytics function for club stats (fixed nested aggregates)
CREATE OR REPLACE FUNCTION public.get_club_analytics(_club_id UUID, _days INTEGER DEFAULT 30)
RETURNS TABLE(
  total_members BIGINT,
  active_members BIGINT,
  total_events BIGINT,
  upcoming_events BIGINT,
  total_attendees BIGINT,
  avg_attendance NUMERIC,
  member_growth JSONB,
  event_participation JSONB
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      COUNT(DISTINCT cm.user_id) as total_count,
      COUNT(DISTINCT CASE WHEN cm.status = 'active' THEN cm.user_id END) as active_count,
      COUNT(DISTINCT e.id) as total_evt,
      COUNT(DISTINCT CASE WHEN e.event_date > now() THEN e.id END) as upcoming_evt,
      COUNT(CASE WHEN er.checked_in_at IS NOT NULL THEN 1 END) as checked_in,
      COUNT(DISTINCT CASE WHEN e.event_date < now() THEN e.id END) as past_events
    FROM public.clubs c
    LEFT JOIN public.club_members cm ON c.id = cm.club_id
    LEFT JOIN public.events e ON c.id = e.club_id
    LEFT JOIN public.event_registrations er ON e.id = er.event_id
    WHERE c.id = _club_id
  ),
  growth_daily AS (
    SELECT 
      date_trunc('day', joined_at)::date as join_date,
      COUNT(*) as member_count
    FROM public.club_members
    WHERE club_id = _club_id 
      AND joined_at >= now() - (_days || ' days')::INTERVAL
      AND status = 'active'
    GROUP BY date_trunc('day', joined_at)::date
  ),
  growth AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'date', join_date,
        'count', member_count
      ) ORDER BY join_date
    ) as growth_data
    FROM growth_daily
  ),
  participation_by_event AS (
    SELECT 
      e.title,
      COUNT(er.id) as registered_count,
      COUNT(CASE WHEN er.checked_in_at IS NOT NULL THEN 1 END) as attended_count
    FROM public.events e
    LEFT JOIN public.event_registrations er ON e.id = er.event_id
    WHERE e.club_id = _club_id 
      AND e.event_date >= now() - (_days || ' days')::INTERVAL
    GROUP BY e.id, e.title
  ),
  participation AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'event_title', title,
        'registered', registered_count,
        'attended', attended_count
      )
    ) as part_data
    FROM participation_by_event
  )
  SELECT 
    stats.total_count,
    stats.active_count,
    stats.total_evt,
    stats.upcoming_evt,
    stats.checked_in,
    CASE 
      WHEN stats.past_events > 0 
      THEN ROUND(stats.checked_in::NUMERIC / stats.past_events, 2)
      ELSE 0
    END,
    COALESCE(growth.growth_data, '[]'::jsonb),
    COALESCE(participation.part_data, '[]'::jsonb)
  FROM stats, growth, participation;
END;
$$;

-- Trigger to auto-assign member role when joining club
CREATE OR REPLACE FUNCTION public.assign_member_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'active' AND NOT EXISTS (
    SELECT 1 FROM public.club_roles 
    WHERE club_id = NEW.club_id AND user_id = NEW.user_id
  ) THEN
    INSERT INTO public.club_roles (club_id, user_id, role)
    VALUES (NEW.club_id, NEW.user_id, 'member');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_club_member_active
  AFTER INSERT OR UPDATE ON public.club_members
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_member_role();