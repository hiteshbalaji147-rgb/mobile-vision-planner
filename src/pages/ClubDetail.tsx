import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Calendar, Settings } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface Club {
  id: string;
  name: string;
  description: string | null;
  category: string;
  banner_url: string | null;
  faculty_coordinator: string | null;
  created_by: string;
}

interface Event {
  id: string;
  title: string;
  event_date: string;
  venue: string;
}

const ClubDetail = () => {
  const { clubId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [club, setClub] = useState<Club | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [isLeader, setIsLeader] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clubId) {
      fetchClubDetails();
    }
  }, [clubId, user]);

  const fetchClubDetails = async () => {
    if (!clubId) return;

    setLoading(true);

    // Fetch club details
    const { data: clubData } = await supabase
      .from('clubs')
      .select('*')
      .eq('id', clubId)
      .single();

    if (clubData) {
      setClub(clubData);
      setIsLeader(user?.id === clubData.created_by);
    }

    // Fetch events
    const { data: eventsData } = await supabase
      .from('events')
      .select('id, title, event_date, venue')
      .eq('club_id', clubId)
      .gte('event_date', new Date().toISOString())
      .order('event_date', { ascending: true })
      .limit(5);

    if (eventsData) {
      setEvents(eventsData);
    }

    // Check membership
    if (user) {
      const { data: memberData } = await supabase
        .from('club_members')
        .select('*')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      setIsMember(!!memberData);
    }

    // Get member count
    const { count } = await supabase
      .from('club_members')
      .select('*', { count: 'exact', head: true })
      .eq('club_id', clubId)
      .eq('status', 'active');

    setMemberCount(count || 0);
    setLoading(false);
  };

  const handleJoinLeave = async () => {
    if (!user || !clubId) return;

    if (isMember) {
      // Leave club
      const { error } = await supabase
        .from('club_members')
        .delete()
        .eq('club_id', clubId)
        .eq('user_id', user.id);

      if (!error) {
        setIsMember(false);
        setMemberCount(prev => prev - 1);
        toast({ title: 'Left club successfully' });
      }
    } else {
      // Join club
      const { error } = await supabase
        .from('club_members')
        .insert({
          club_id: clubId,
          user_id: user.id,
          status: 'active',
        });

      if (!error) {
        setIsMember(true);
        setMemberCount(prev => prev + 1);
        toast({ title: 'Joined club successfully' });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-48 rounded-lg mb-6" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Club not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="bg-primary text-primary-foreground p-6 rounded-b-3xl shadow-lg mb-6">
        <div className="flex items-center justify-between mb-4">
          <Link to="/clubs">
            <Button variant="ghost" size="icon" className="text-primary-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          {isLeader && (
            <Link to={`/manage/${clubId}`}>
              <Button variant="ghost" size="icon" className="text-primary-foreground">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>
        
        <Badge className="mb-3 capitalize">{club.category}</Badge>
        <h1 className="text-3xl font-bold mb-2">{club.name}</h1>
        <div className="flex items-center gap-4 text-sm text-primary-foreground/80">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{memberCount} members</span>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6">
        {club.description && (
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{club.description}</p>
            </CardContent>
          </Card>
        )}

        {club.faculty_coordinator && (
          <Card>
            <CardHeader>
              <CardTitle>Faculty Coordinator</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{club.faculty_coordinator}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Events
              </CardTitle>
              <Link to="/events">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {events.length > 0 ? (
              <div className="space-y-3">
                {events.map((event) => (
                  <Link key={event.id} to={`/events/${event.id}`}>
                    <div className="p-3 rounded-lg hover:bg-muted transition-colors">
                      <h3 className="font-semibold">{event.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.event_date).toLocaleDateString()} • {event.venue}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No upcoming events
              </p>
            )}
          </CardContent>
        </Card>

        {user && (
          <Button
            className="w-full"
            variant={isMember ? 'outline' : 'default'}
            onClick={handleJoinLeave}
          >
            {isMember ? 'Leave Club' : 'Join Club'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ClubDetail;