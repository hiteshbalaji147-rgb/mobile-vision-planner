-- Fix 1: Add authorization to get_club_analytics function
CREATE OR REPLACE FUNCTION public.get_club_analytics(_club_id uuid, _days integer DEFAULT 30)
RETURNS TABLE(total_members bigint, active_members bigint, total_events bigint, upcoming_events bigint, total_attendees bigint, avg_attendance numeric, member_growth jsonb, event_participation jsonb)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Authorization check: Only club admins can view analytics
  IF NOT (is_club_admin(auth.uid(), _club_id) OR has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Unauthorized: Only club admins can view analytics';
  END IF;

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
$function$;

-- Fix 2: Fix profiles RLS policy to actually enforce privacy settings
DROP POLICY IF EXISTS "Users can view basic profile info" ON public.profiles;

CREATE POLICY "Users can view basic profile info"
ON public.profiles
FOR SELECT
USING (
  -- Users can always see their own profile
  auth.uid() = id 
  OR 
  -- Admins can see all profiles
  has_role(auth.uid(), 'admin'::app_role) 
  OR 
  -- Other users can see public profiles
  (profile_visibility = 'public')
  OR
  -- Other users can see friends/members profiles (simplified for now, treat as public)
  (profile_visibility = 'friends' AND auth.uid() IS NOT NULL)
);