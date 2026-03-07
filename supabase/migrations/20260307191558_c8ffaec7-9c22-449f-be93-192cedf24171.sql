
-- Hackathon teams table
CREATE TABLE public.hackathon_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  max_members INTEGER DEFAULT 4,
  invite_code TEXT NOT NULL DEFAULT substr(md5(random()::text), 1, 8),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, name),
  UNIQUE(invite_code)
);

-- Hackathon team members table
CREATE TABLE public.hackathon_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.hackathon_teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- RLS for hackathon_teams
ALTER TABLE public.hackathon_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teams are viewable by everyone"
  ON public.hackathon_teams FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create teams"
  ON public.hackathon_teams FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team creators can update their teams"
  ON public.hackathon_teams FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Team creators can delete their teams"
  ON public.hackathon_teams FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- RLS for hackathon_team_members
ALTER TABLE public.hackathon_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members are viewable by everyone"
  ON public.hackathon_team_members FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can join teams"
  ON public.hackathon_team_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave teams"
  ON public.hackathon_team_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
