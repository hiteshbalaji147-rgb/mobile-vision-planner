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
    <div className="min-h-screen bg-muted pb-20">
      {/* Amazon-style Header */}
      <header className="bg-primary text-primary-foreground shadow-md">
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-3">ClubTuner</h1>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search clubs and events"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white text-foreground border-0 h-10"
            />
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* My Clubs Section */}
        <section className="bg-card rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              My Clubs
            </h2>
            <Link to="/clubs">
              <Button variant="link" size="sm" className="text-primary">
                See all
              </Button>
            </Link>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 rounded" />
              ))}
            </div>
          ) : joinedClubs.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {joinedClubs.map((club) => (
                <Link key={club.id} to={`/clubs/${club.id}`}>
                  <Card className="hover:shadow-md transition-shadow border border-border">
                    <CardContent className="p-3">
                      <div className="aspect-video bg-muted rounded mb-2 overflow-hidden">
                        {club.banner_url ? (
                          <img src={club.banner_url} alt={club.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Users className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm truncate">{club.name}</h3>
                      <p className="text-xs text-muted-foreground capitalize">{club.category}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">You haven't joined any clubs yet</p>
              <Link to="/clubs">
                <Button>Browse Clubs</Button>
              </Link>
            </div>
          )}
        </section>

        {/* Upcoming Events Section */}
        <section className="bg-card rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-accent" />
              Upcoming Events
            </h2>
            <Link to="/events">
              <Button variant="link" size="sm" className="text-primary">
                See all
              </Button>
            </Link>
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 rounded" />
              ))}
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <Link key={event.id} to={`/events/${event.id}`}>
                  <Card className="hover:shadow-md transition-shadow border border-border">
                    <CardContent className="p-3 flex gap-3">
                      <div className="w-20 h-20 bg-muted rounded flex-shrink-0 flex flex-col items-center justify-center">
                        <div className="text-2xl font-bold">
                          {new Date(event.event_date).getDate()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(event.event_date).toLocaleDateString('en', { month: 'short' })}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-1 line-clamp-2">{event.title}</h3>
                        <p className="text-xs text-primary mb-1">{event.clubs.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{event.venue}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
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