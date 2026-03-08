import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Users, Plus, Link as LinkIcon, Copy, UserPlus, LogOut, X, Tag } from 'lucide-react';

interface TeamMember {
  user_id: string;
  skills: string[] | null;
  profiles: { full_name: string; avatar_url: string | null };
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  max_members: number;
  invite_code: string;
  created_by: string;
  hackathon_team_members: TeamMember[];
}

interface HackathonTeamDialogProps {
  eventId: string;
  eventTitle: string;
}

export const HackathonTeamDialog = ({ eventId, eventTitle }: HackathonTeamDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [maxMembers, setMaxMembers] = useState(4);
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [skillInput, setSkillInput] = useState('');
  const [mySkills, setMySkills] = useState<string[]>([]);

  useEffect(() => {
    if (open) fetchTeams();
  }, [open, eventId]);

  const fetchTeams = async () => {
    const { data } = await supabase
      .from('hackathon_teams')
      .select('*, hackathon_team_members(user_id, skills, profiles(full_name, avatar_url))')
      .eq('event_id', eventId);

    if (data) {
      setTeams(data as unknown as Team[]);
      if (user) {
        const found = data.find((t: any) =>
          t.hackathon_team_members?.some((m: any) => m.user_id === user.id)
        );
        setMyTeam((found as unknown as Team) || null);
        if (found) {
          const myMember = (found as any).hackathon_team_members?.find((m: any) => m.user_id === user.id);
          setMySkills(myMember?.skills || []);
        }
      }
    }
  };

  const createTeam = async () => {
    if (!user || !teamName.trim()) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('hackathon_teams')
      .insert({ event_id: eventId, name: teamName.trim(), description: teamDesc.trim() || null, max_members: maxMembers, created_by: user.id })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Auto-join creator
    await supabase.from('hackathon_team_members').insert({ team_id: data.id, user_id: user.id });

    setTeamName('');
    setTeamDesc('');
    toast({ title: 'Team created!' });
    await fetchTeams();
    setLoading(false);
  };

  const joinByCode = async () => {
    if (!user || !inviteCode.trim()) return;
    setLoading(true);

    const { data: team } = await supabase
      .from('hackathon_teams')
      .select('*, hackathon_team_members(user_id)')
      .eq('invite_code', inviteCode.trim())
      .eq('event_id', eventId)
      .single();

    if (!team) {
      toast({ title: 'Invalid invite code', variant: 'destructive' });
      setLoading(false);
      return;
    }

    const members = (team as any).hackathon_team_members || [];
    if (members.length >= (team.max_members || 4)) {
      toast({ title: 'Team is full', variant: 'destructive' });
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('hackathon_team_members').insert({ team_id: team.id, user_id: user.id });
    if (error) {
      toast({ title: 'Error joining team', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `Joined ${team.name}!` });
      setInviteCode('');
    }
    await fetchTeams();
    setLoading(false);
  };

  const leaveTeam = async () => {
    if (!user || !myTeam) return;
    setLoading(true);
    await supabase.from('hackathon_team_members').delete().eq('team_id', myTeam.id).eq('user_id', user.id);
    toast({ title: 'Left team' });
    await fetchTeams();
    setLoading(false);
  };

  const copyInvite = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Invite code copied!' });
  };

  const addSkill = async () => {
    const skill = skillInput.trim().toLowerCase();
    if (!skill || !user || !myTeam || mySkills.includes(skill)) {
      setSkillInput('');
      return;
    }
    const updated = [...mySkills, skill];
    setMySkills(updated);
    setSkillInput('');
    await supabase
      .from('hackathon_team_members')
      .update({ skills: updated } as any)
      .eq('team_id', myTeam.id)
      .eq('user_id', user.id);
    await fetchTeams();
  };

  const removeSkill = async (skill: string) => {
    if (!user || !myTeam) return;
    const updated = mySkills.filter((s) => s !== skill);
    setMySkills(updated);
    await supabase
      .from('hackathon_team_members')
      .update({ skills: updated } as any)
      .eq('team_id', myTeam.id)
      .eq('user_id', user.id);
    await fetchTeams();
  };

  const memberCount = (team: Team) => team.hackathon_team_members?.length || 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className="gap-1.5" onClickCapture={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(true); }}>
          <Users className="h-3.5 w-3.5" />
          Teams
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Hackathon Teams</DialogTitle>
          <DialogDescription>{eventTitle}</DialogDescription>
        </DialogHeader>

        {!user ? (
          <p className="text-sm text-muted-foreground text-center py-4">Log in to create or join teams.</p>
        ) : myTeam ? (
          <div className="space-y-4">
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{myTeam.name}</h3>
                  <Badge variant="secondary">{memberCount(myTeam)}/{myTeam.max_members}</Badge>
                </div>
                {myTeam.description && <p className="text-sm text-muted-foreground">{myTeam.description}</p>}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Members</p>
                  {myTeam.hackathon_team_members.map((m) => (
                    <div key={m.user_id} className="space-y-1">
                      <p className="text-sm font-medium">{m.profiles.full_name}</p>
                      {m.skills && m.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {m.skills.map((s) => (
                            <Badge key={s} variant="outline" className="text-[10px] px-1.5 py-0">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                    <Tag className="h-3 w-3" /> My Skills
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {mySkills.map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs gap-1">
                        {s}
                        <button onClick={() => removeSkill(s)} className="hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. React, Python, UI/UX"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                      className="h-8 text-sm"
                      maxLength={30}
                    />
                    <Button size="sm" variant="outline" onClick={addSkill} disabled={!skillInput.trim()} className="h-8">
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded px-3 py-1.5 text-sm font-mono">{myTeam.invite_code}</div>
                  <Button size="icon" variant="ghost" onClick={() => copyInvite(myTeam.invite_code)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="outline" size="sm" className="w-full text-destructive" onClick={leaveTeam} disabled={loading}>
                  <LogOut className="h-3.5 w-3.5 mr-1.5" /> Leave Team
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Tabs defaultValue="join" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="join">Join by Code</TabsTrigger>
              <TabsTrigger value="browse">Browse</TabsTrigger>
              <TabsTrigger value="create">Create</TabsTrigger>
            </TabsList>

            <TabsContent value="join" className="space-y-3 mt-3">
              <div className="space-y-2">
                <Label>Invite Code</Label>
                <div className="flex gap-2">
                  <Input placeholder="Enter invite code" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} />
                  <Button onClick={joinByCode} disabled={loading || !inviteCode.trim()}>
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="browse" className="space-y-3 mt-3">
              {teams.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No teams yet. Be the first to create one!</p>
              ) : (
                teams.map((team) => (
                  <Card key={team.id}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{team.name}</p>
                        <p className="text-xs text-muted-foreground">{memberCount(team)}/{team.max_members} members</p>
                      </div>
                      {memberCount(team) < team.max_members && (
                        <Button size="sm" variant="secondary" onClick={() => { setInviteCode(team.invite_code); joinByCode(); }}>
                          Join
                        </Button>
                      )}
                      {memberCount(team) >= team.max_members && (
                        <Badge variant="outline">Full</Badge>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="create" className="space-y-3 mt-3">
              <div className="space-y-2">
                <Label>Team Name</Label>
                <Input placeholder="e.g. Code Crusaders" value={teamName} onChange={(e) => setTeamName(e.target.value)} maxLength={50} />
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Input placeholder="Brief team description" value={teamDesc} onChange={(e) => setTeamDesc(e.target.value)} maxLength={200} />
              </div>
              <div className="space-y-2">
                <Label>Max Members</Label>
                <Input type="number" min={2} max={10} value={maxMembers} onChange={(e) => setMaxMembers(Number(e.target.value))} />
              </div>
              <Button className="w-full" onClick={createTeam} disabled={loading || !teamName.trim()}>
                <Plus className="h-4 w-4 mr-1.5" /> Create Team
              </Button>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
