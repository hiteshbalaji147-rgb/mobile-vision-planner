-- Fix security definer view by creating a function instead
DROP VIEW IF EXISTS public.leaderboard;

CREATE OR REPLACE FUNCTION get_leaderboard()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  avatar_url TEXT,
  total_points INTEGER,
  clubs_joined BIGINT,
  events_attended BIGINT,
  achievements_earned BIGINT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.full_name,
    p.avatar_url,
    get_user_total_points(p.id) as total_points,
    COUNT(DISTINCT cm.club_id) as clubs_joined,
    COUNT(DISTINCT er.event_id) FILTER (WHERE er.checked_in_at IS NOT NULL) as events_attended,
    COUNT(DISTINCT ua.achievement_id) as achievements_earned
  FROM public.profiles p
  LEFT JOIN public.club_members cm ON p.id = cm.user_id AND cm.status = 'active'
  LEFT JOIN public.event_registrations er ON p.id = er.user_id
  LEFT JOIN public.user_achievements ua ON p.id = ua.user_id
  GROUP BY p.id, p.full_name, p.avatar_url
  ORDER BY total_points DESC
$$;

-- Fix search_path for existing functions
DROP FUNCTION IF EXISTS get_user_total_points(UUID);
CREATE OR REPLACE FUNCTION get_user_total_points(_user_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(points), 0)::INTEGER
  FROM public.user_points
  WHERE user_id = _user_id
$$;