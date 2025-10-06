-- Create achievements/badges table
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  points_required INTEGER NOT NULL DEFAULT 0,
  badge_type TEXT NOT NULL CHECK (badge_type IN ('bronze', 'silver', 'gold', 'platinum')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user points table
CREATE TABLE public.user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('event_attendance', 'event_organizing', 'volunteering', 'club_membership')),
  activity_id UUID,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user achievements junction table
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Add ticket pricing and QR code to event_registrations
ALTER TABLE public.event_registrations 
ADD COLUMN ticket_price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN qr_code TEXT,
ADD COLUMN checked_in_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN payment_status TEXT DEFAULT 'free' CHECK (payment_status IN ('free', 'pending', 'paid', 'refunded'));

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements
CREATE POLICY "Achievements are viewable by everyone"
ON public.achievements FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage achievements"
ON public.achievements FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for user_points
CREATE POLICY "Users can view all points"
ON public.user_points FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "System can create points"
ON public.user_points FOR INSERT
TO authenticated
WITH CHECK (true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view all achievements earned"
ON public.user_achievements FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "System can award achievements"
ON public.user_achievements FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create function to get user total points
CREATE OR REPLACE FUNCTION get_user_total_points(_user_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
AS $$
  SELECT COALESCE(SUM(points), 0)::INTEGER
  FROM public.user_points
  WHERE user_id = _user_id
$$;

-- Create function to award points
CREATE OR REPLACE FUNCTION award_points(
  _user_id UUID,
  _points INTEGER,
  _activity_type TEXT,
  _activity_id UUID,
  _description TEXT
)
RETURNS VOID
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

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, points_required, badge_type) VALUES
('Event Newbie', 'Attend your first event', '🌟', 10, 'bronze'),
('Event Regular', 'Attend 5 events', '⭐', 50, 'silver'),
('Event Champion', 'Attend 20 events', '🏆', 200, 'gold'),
('Club Enthusiast', 'Join 3 clubs', '🎯', 30, 'bronze'),
('Super Organizer', 'Organize 5 events', '👑', 100, 'gold'),
('Volunteer Hero', 'Volunteer for 10 activities', '❤️', 150, 'gold'),
('Point Master', 'Earn 500 total points', '💎', 500, 'platinum');

-- Create trigger to award points on event registration
CREATE OR REPLACE FUNCTION award_event_attendance_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Award points when user checks in
  IF NEW.checked_in_at IS NOT NULL AND OLD.checked_in_at IS NULL THEN
    PERFORM award_points(
      NEW.user_id,
      10,
      'event_attendance',
      NEW.event_id,
      'Attended event'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER event_checkin_points_trigger
AFTER UPDATE ON public.event_registrations
FOR EACH ROW
EXECUTE FUNCTION award_event_attendance_points();

-- Create view for leaderboard
CREATE OR REPLACE VIEW public.leaderboard AS
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
ORDER BY total_points DESC;