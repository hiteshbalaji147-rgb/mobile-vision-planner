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
      <header className="bg-gradient-to-br from-primary via-primary to-primary-dark text-primary-foreground p-6 rounded-b-3xl shadow-xl">
        <h1 className="text-2xl font-bold mb-2">Welcome back!</h1>
        <p className="text-primary-foreground/90">Discover clubs and events tailored for you</p>
        
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search clubs and events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-0 shadow-md"
          />
        </div>
      </header>

      <main className="p-6 space-y-6">
        {/* My Clubs Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              My Clubs
            </h2>
            <Link to="/clubs">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>
          
          {loading ? (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="min-w-[200px] h-24 rounded-lg" />
              ))}
            </div>
          ) : joinedClubs.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {joinedClubs.map((club) => (
                <Link key={club.id} to={`/clubs/${club.id}`}>
                  <Card className="min-w-[200px] hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <h3 className="font-semibold truncate">{club.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{club.category}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <p>You haven't joined any clubs yet</p>
                <Link to="/clubs">
                  <Button className="mt-4">Explore Clubs</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Upcoming Events Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-accent" />
              Upcoming Events
            </h2>
            <Link to="/events">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <Link key={event.id} to={`/events/${event.id}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <h3 className="font-semibold">{event.title}</h3>
                      <p className="text-sm text-muted-foreground">{event.clubs.name}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{new Date(event.event_date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{event.venue}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <p>No upcoming events</p>
              </CardContent>
            </Card>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default Dashboard;