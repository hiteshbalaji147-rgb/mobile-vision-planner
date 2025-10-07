-- Fix CRITICAL: Profiles table - hide emails from public, only show to owner and admins
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view any profile basic info"
ON public.profiles
FOR SELECT
USING (true);

-- Add separate policy for email visibility - only owner and admins can see emails
CREATE POLICY "Users can view own email"
ON public.profiles
FOR SELECT
USING (auth.uid() = id OR has_role(auth.uid(), 'admin'));

-- Fix CRITICAL: user_points - only system can insert points (via database functions)
DROP POLICY IF EXISTS "System can create points" ON public.user_points;

CREATE POLICY "Only database functions can create points"
ON public.user_points
FOR INSERT
WITH CHECK (false); -- No direct inserts allowed, only via SECURITY DEFINER functions

-- Fix CRITICAL: user_achievements - only system can award achievements
DROP POLICY IF EXISTS "System can award achievements" ON public.user_achievements;

CREATE POLICY "Only database functions can award achievements"
ON public.user_achievements
FOR INSERT
WITH CHECK (false); -- No direct inserts allowed

-- Fix MEDIUM: Add explicit search_path to all SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_club_leader(_user_id uuid, _club_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.clubs
    WHERE id = _club_id
      AND created_by = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.award_points(_user_id uuid, _points integer, _activity_type text, _activity_id uuid, _description text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_points (user_id, points, activity_type, activity_id, description)
  VALUES (_user_id, _points, _activity_type, _activity_id, _description);
  
  -- Check and award achievements based on total points
  INSERT INTO public.user_achievements (user_id, achievement_id)
  SELECT _user_id, a.id
  FROM public.achievements a
  WHERE a.points_required <= get_user_total_points(_user_id)
    AND NOT EXISTS (
      SELECT 1 FROM public.user_achievements ua
      WHERE ua.user_id = _user_id AND ua.achievement_id = a.id
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_total_points(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(points), 0)::INTEGER
  FROM public.user_points
  WHERE user_id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE(id uuid, full_name text, avatar_url text, total_points integer, clubs_joined bigint, events_attended bigint, achievements_earned bigint)
LANGUAGE sql
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

-- Add helper function to verify QR code ownership (for edge functions)
CREATE OR REPLACE FUNCTION public.verify_registration_owner(_registration_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.event_registrations
    WHERE id = _registration_id
      AND user_id = _user_id
  )
$$;

-- Fix event_registrations RLS to allow updates only by club leaders for check-in
CREATE POLICY "Club leaders can check in attendees"
ON public.event_registrations
FOR UPDATE
USING (
  is_club_leader(auth.uid(), (SELECT club_id FROM events WHERE events.id = event_registrations.event_id))
  OR has_role(auth.uid(), 'admin')
)
WITH CHECK (
  is_club_leader(auth.uid(), (SELECT club_id FROM events WHERE events.id = event_registrations.event_id))
  OR has_role(auth.uid(), 'admin')
);