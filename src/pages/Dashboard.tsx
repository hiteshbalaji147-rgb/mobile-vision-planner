import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { BottomNav } from '@/components/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Users, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

interface Club {
  id: string;
  name: string;
  category: string;
  banner_url: string | null;
}

interface Event {
  id: string;
  title: string;
  event_date: string;
  venue: string;
  clubs: { name: string };
}

const Dashboard = () => {
  const { user } = useAuth();
  const [joinedClubs, setJoinedClubs] = useState<Club[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);

    // Fetch joined clubs if user is logged in
    if (user) {
      const { data: memberships } = await supabase
        .from('club_members')
        .select('clubs(id, name, category, banner_url)')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (memberships) {
        setJoinedClubs(memberships.map((m: any) => m.clubs));
      }
    }

    // Fetch upcoming events
    const { data: events } = await supabase
      .from('events')
      .select('id, title, event_date, venue, clubs(name)')
      .gte('event_date', new Date().toISOString())
      .order('event_date', { ascending: true })
      .limit(5);

    if (events) {
      setUpcomingEvents(events);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Netflix-style Hero Header */}
      <header className="relative h-[60vh] bg-gradient-to-b from-background via-background/50 to-background">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200')] bg-cover bg-center opacity-20" />
        
        <div className="relative z-20 p-6 pt-12 h-full flex flex-col justify-end">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-foreground">ClubTuner</h1>
          <p className="text-lg text-muted-foreground mb-6">Your campus. Your clubs. Your events.</p>
          
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search clubs and events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 bg-card/80 backdrop-blur-sm border-2 border-muted text-lg"
            />
          </div>
        </div>
      </header>

      <main className="px-4 md:px-8 space-y-8 -mt-20 relative z-30">
        {/* My Clubs Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              My Clubs
            </h2>
            <Link to="/clubs">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                View All →
              </Button>
            </Link>
          </div>
          
          {loading ? (
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="min-w-[280px] h-40 rounded" />
              ))}
            </div>
          ) : joinedClubs.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
              {joinedClubs.map((club) => (
                <Link key={club.id} to={`/clubs/${club.id}`} className="group">
                  <div className="min-w-[280px] h-40 bg-card rounded overflow-hidden relative transition-all duration-300 hover:scale-105 hover:z-10 hover:shadow-[var(--shadow-lg)]">
                    {club.banner_url ? (
                      <img src={club.banner_url} alt={club.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="font-bold text-lg truncate">{club.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{club.category}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-card/50 rounded p-8 text-center">
              <p className="text-muted-foreground mb-4">You haven't joined any clubs yet</p>
              <Link to="/clubs">
                <Button>Explore Clubs</Button>
              </Link>
            </div>
          )}
        </section>

        {/* Upcoming Events Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              Upcoming Events
            </h2>
            <Link to="/events">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                View All →
              </Button>
            </Link>
          </div>
          
          {loading ? (
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="min-w-[320px] h-48 rounded" />
              ))}
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
              {upcomingEvents.map((event) => (
                <Link key={event.id} to={`/events/${event.id}`} className="group">
                  <div className="min-w-[320px] h-48 bg-card rounded overflow-hidden relative transition-all duration-300 hover:scale-105 hover:z-10 hover:shadow-[var(--shadow-lg)]">
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-card" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <h3 className="font-bold text-lg mb-1">{event.title}</h3>
                      <p className="text-sm text-primary mb-2">{event.clubs.name}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{new Date(event.event_date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="truncate">{event.venue}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-card/50 rounded p-8 text-center">
              <p className="text-muted-foreground">No upcoming events</p>
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default Dashboard;