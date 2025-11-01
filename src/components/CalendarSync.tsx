import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface CalendarSyncProps {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  venue: string;
  description?: string;
  googleCalendarId?: string | null;
  outlookEventId?: string | null;
}

const CalendarSync = ({ 
  eventId, 
  eventTitle, 
  eventDate, 
  venue, 
  description,
  googleCalendarId,
  outlookEventId 
}: CalendarSyncProps) => {
  const [syncing, setSyncing] = useState(false);

  const generateGoogleCalendarUrl = () => {
    const startDate = new Date(eventDate);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours default

    const formatDateForGoogle = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, '');
    };

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: eventTitle,
      dates: `${formatDateForGoogle(startDate)}/${formatDateForGoogle(endDate)}`,
      details: description || '',
      location: venue,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const generateOutlookCalendarUrl = () => {
    const startDate = new Date(eventDate);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    const params = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      subject: eventTitle,
      startdt: startDate.toISOString(),
      enddt: endDate.toISOString(),
      body: description || '',
      location: venue,
    });

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
  };

  const addToGoogleCalendar = () => {
    const url = generateGoogleCalendarUrl();
    window.open(url, '_blank');
    toast.success('Opening Google Calendar...');
  };

  const addToOutlookCalendar = () => {
    const url = generateOutlookCalendarUrl();
    window.open(url, '_blank');
    toast.success('Opening Outlook Calendar...');
  };

  const downloadICS = () => {
    const startDate = new Date(eventDate);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    const formatDateForICS = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, '');
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ClubTuner//Event//EN',
      'BEGIN:VEVENT',
      `UID:${eventId}@clubtuner.app`,
      `DTSTAMP:${formatDateForICS(new Date())}`,
      `DTSTART:${formatDateForICS(startDate)}`,
      `DTEND:${formatDateForICS(endDate)}`,
      `SUMMARY:${eventTitle}`,
      `DESCRIPTION:${description || ''}`,
      `LOCATION:${venue}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${eventTitle.replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Calendar event downloaded');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          <CardTitle>Calendar Sync</CardTitle>
        </div>
        <CardDescription>
          Add this event to your personal calendar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={addToGoogleCalendar}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Google Calendar
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={addToOutlookCalendar}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Outlook
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={downloadICS}
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Download .ics
          </Button>
        </div>
        
        {(googleCalendarId || outlookEventId) && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground mb-2">Synced with:</p>
            <div className="flex gap-2">
              {googleCalendarId && (
                <Badge variant="secondary">Google Calendar</Badge>
              )}
              {outlookEventId && (
                <Badge variant="secondary">Outlook</Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CalendarSync;
