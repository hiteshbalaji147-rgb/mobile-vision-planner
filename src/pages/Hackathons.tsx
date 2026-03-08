import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { BottomNav } from '@/components/BottomNav';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Trophy, Code2, Users, CheckCircle2, Award, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CountdownTimer } from '@/components/CountdownTimer';
import { HackathonTeamDialog } from '@/components/HackathonTeamDialog';

interface Prize {
  place: string;
  prize: string;
}

interface Event {
  id: string;
  title: string;
  event_date: string;
  venue: string;
  status: string;
  description: string | null;
  banner_url: string | null;
  max_capacity: number | null;
  clubs: { name: string };
  prize_pool: string | null;
  prizes: Prize[] | null;
  sponsors: string[] | null;
}

const Hackathons = () => {
  const { user } = useAuth();
  const [hackathons, setHackathons] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [registrations, setRegistrations] = useState<Record<string, boolean>>({});
  const [regCounts, setRegCounts] = useState<Record<string, number>>({});
  const [teamCounts, setTeamCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchHackathons();
  }, [activeTab, user]);

  const fetchHackathons = async () => {
    setLoading(true);
    
    let query = supabase
      .from('events')
      .select('*, clubs(name)')
      .or('title.ilike.%hackathon%,description.ilike.%hackathon%')
      .order('event_date', { ascending: activeTab === 'upcoming' });

    if (activeTab === 'upcoming') {
      query = query.gte('event_date', new Date().toISOString());
    } else {
      query = query.lt('event_date', new Date().toISOString());
    }

    const { data } = await query;

    if (data) {
      setHackathons(data as unknown as Event[]);
      
      // Fetch registration counts and team counts
      const eventIds = data.map((e: any) => e.id);
      
      if (eventIds.length > 0) {
        // Registration counts per event
        const { data: regData } = await supabase
          .from('event_registrations')
          .select('event_id')
          .in('event_id', eventIds);
        
        const counts: Record<string, number> = {};
        regData?.forEach((r: any) => { counts[r.event_id] = (counts[r.event_id] || 0) + 1; });
        setRegCounts(counts);

        // Team counts per event
        const { data: teamData } = await supabase
          .from('hackathon_teams')
          .select('event_id')
          .in('event_id', eventIds);
        
        const tCounts: Record<string, number> = {};
        teamData?.forEach((t: any) => { tCounts[t.event_id] = (tCounts[t.event_id] || 0) + 1; });
        setTeamCounts(tCounts);

        // User's registrations
        if (user) {
          const { data: myRegs } = await supabase
            .from('event_registrations')
            .select('event_id')
            .in('event_id', eventIds)
            .eq('user_id', user.id);
          
          const regMap: Record<string, boolean> = {};
          myRegs?.forEach((r: any) => { regMap[r.event_id] = true; });
          setRegistrations(regMap);
        }
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header with gradient */}
      <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Code2 className="h-8 w-8" />
          <h1 className="text-2xl font-bold">Hackathons</h1>
        </div>
        <p className="text-white/80 text-sm">Compete, code, and innovate</p>
      </header>

      <main className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-40 rounded-lg" />
            ))}
          </div>
        ) : hackathons.length > 0 ? (
          <div className="space-y-4">
            {hackathons.map((hackathon) => (
              <Link key={hackathon.id} to={`/events/${hackathon.id}`}>
                <Card className="hover:shadow-lg transition-all border-l-4 border-l-purple-500 overflow-hidden">
                  <CardContent className="p-0">
                    {hackathon.banner_url && (
                      <div className="h-32 w-full overflow-hidden">
                        <img 
                          src={hackathon.banner_url} 
                          alt={hackathon.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-yellow-500" />
                          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                            Hackathon
                          </Badge>
                        </div>
                        <Badge variant="secondary" className="capitalize">
                          {hackathon.status}
                        </Badge>
                      </div>
                      <h3 className="font-bold text-lg mb-1">{hackathon.title}</h3>
                      <p className="text-sm text-primary mb-3">
                        {hackathon.clubs.name}
                      </p>
                      {hackathon.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {hackathon.description}
                        </p>
                      )}
                      {activeTab === 'upcoming' && (
                        <div className="mb-3 p-2 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Starts in:</p>
                          <CountdownTimer targetDate={hackathon.event_date} />
                        </div>
                      )}
                      <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(hackathon.event_date).toLocaleString('en', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}</span>
                        </div>
                        {hackathon.venue && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{hackathon.venue}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>
                            {regCounts[hackathon.id] || 0} registered
                            {hackathon.max_capacity && ` / ${hackathon.max_capacity}`}
                            {teamCounts[hackathon.id] ? ` · ${teamCounts[hackathon.id]} team${teamCounts[hackathon.id] > 1 ? 's' : ''}` : ''}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        {registrations[hackathon.id] && (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Registered
                          </Badge>
                        )}
                        {activeTab === 'upcoming' && (
                          <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                            <HackathonTeamDialog eventId={hackathon.id} eventTitle={hackathon.title} />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Code2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold text-lg mb-2">
                No {activeTab} hackathons
              </h3>
              <p className="text-muted-foreground">
                {activeTab === 'upcoming' 
                  ? 'Check back later for exciting coding challenges!'
                  : 'No past hackathons to display.'}
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Hackathons;
