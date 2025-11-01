import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, MapPin, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import CalendarSync from '@/components/CalendarSync';

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  venue: string;
  max_capacity: number | null;
  status: string;
  club_id: string;
  google_calendar_id: string | null;
  outlook_event_id: string | null;
  clubs: { name: string };
}

const EventDetail = () => {
  const { eventId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId, user]);

  const fetchEventDetails = async () => {
    if (!eventId) return;

    setLoading(true);

    // Fetch event details
    const { data: eventData } = await supabase
      .from('events')
      .select('*, clubs(name)')
      .eq('id', eventId)
      .single();

    if (eventData) {
      setEvent(eventData);
    }

    // Check registration
    if (user) {
      const { data: regData } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single();

      setIsRegistered(!!regData);
    }

    // Get attendee count
    const { count } = await supabase
      .from('event_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);

    setAttendeeCount(count || 0);
    setLoading(false);
  };

  const handleRegisterUnregister = async () => {
    if (!user || !eventId) return;

    if (isRegistered) {
      // Unregister
      const { error } = await supabase
        .from('event_registrations')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id);

      if (!error) {
        setIsRegistered(false);
        setAttendeeCount(prev => prev - 1);
        toast({ title: 'Unregistered from event' });
      }
    } else {
      // Register
      const { error } = await supabase
        .from('event_registrations')
        .insert({
          event_id: eventId,
          user_id: user.id,
        });

      if (!error) {
        setIsRegistered(true);
        setAttendeeCount(prev => prev + 1);
        toast({ title: 'Registered for event' });
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

  if (!event) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Event not found</p>
      </div>
    );
  }

  const isPastEvent = new Date(event.event_date) < new Date();
  const isFull = event.max_capacity && attendeeCount >= event.max_capacity;

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="bg-primary text-primary-foreground p-6 rounded-b-3xl shadow-lg mb-6">
        <div className="flex items-center mb-4">
          <Link to="/events">
            <Button variant="ghost" size="icon" className="text-primary-foreground mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
        </div>
        
        <Badge className="mb-3 capitalize">{event.status}</Badge>
        <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
        <Link to={`/clubs/${event.club_id}`} className="text-primary-foreground/80 hover:text-primary-foreground">
          {event.clubs.name}
        </Link>
      </div>

      <div className="px-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Date & Time</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(event.event_date).toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Venue</p>
                <p className="text-sm text-muted-foreground">{event.venue}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Attendees</p>
                <p className="text-sm text-muted-foreground">
                  {attendeeCount}
                  {event.max_capacity && ` / ${event.max_capacity}`} registered
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {event.description && (
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{event.description}</p>
            </CardContent>
          </Card>
        )}

        <CalendarSync
          eventId={event.id}
          eventTitle={event.title}
          eventDate={event.event_date}
          venue={event.venue}
          description={event.description || undefined}
          googleCalendarId={event.google_calendar_id}
          outlookEventId={event.outlook_event_id}
        />

        {user && !isPastEvent && (
          <Button
            className="w-full"
            variant={isRegistered ? 'outline' : 'default'}
            onClick={handleRegisterUnregister}
            disabled={!isRegistered && isFull}
          >
            {!isRegistered && isFull
              ? 'Event Full'
              : isRegistered
              ? 'Unregister'
              : 'Register'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default EventDetail;