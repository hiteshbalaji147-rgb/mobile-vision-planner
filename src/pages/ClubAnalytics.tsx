import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { BottomNav } from '@/components/BottomNav';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Users, Calendar, TrendingUp, Award } from 'lucide-react';
import { toast } from 'sonner';

interface AnalyticsData {
  total_members: number;
  active_members: number;
  total_events: number;
  upcoming_events: number;
  total_attendees: number;
  avg_attendance: number;
  member_growth: Array<{ date: string; count: number }>;
  event_participation: Array<{ event_title: string; registered: number; attended: number }>;
}

const ClubAnalytics = () => {
  const { clubId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [clubName, setClubName] = useState('');
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    if (user && clubId) {
      fetchAnalytics();
    }
  }, [user, clubId, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch club name
      const { data: club } = await supabase
        .from('clubs')
        .select('name')
        .eq('id', clubId)
        .single();

      if (club) setClubName(club.name);

      // Call analytics function
      const { data, error } = await supabase.rpc('get_club_analytics', {
        _club_id: clubId,
        _days: parseInt(timeRange)
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const row = data[0];
        setAnalytics({
          total_members: Number(row.total_members),
          active_members: Number(row.active_members),
          total_events: Number(row.total_events),
          upcoming_events: Number(row.upcoming_events),
          total_attendees: Number(row.total_attendees),
          avg_attendance: Number(row.avg_attendance),
          member_growth: (row.member_growth as any) || [],
          event_participation: (row.event_participation as any) || [],
        });
      }
    } catch (error: any) {
      toast.error('Failed to load analytics');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="container mx-auto p-4 space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="container mx-auto p-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Card className="mt-4">
            <CardContent className="py-8 text-center">
              No analytics data available
            </CardContent>
          </Card>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{clubName} Analytics</h1>
              <p className="text-muted-foreground">Performance insights and trends</p>
            </div>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
              <SelectItem value="365">1 year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.total_members}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.active_members} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.total_events}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.upcoming_events} upcoming
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.avg_attendance}</div>
              <p className="text-xs text-muted-foreground">
                per event
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Check-ins</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.total_attendees}</div>
              <p className="text-xs text-muted-foreground">
                across all events
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Member Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Member Growth</CardTitle>
            <CardDescription>New members over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.member_growth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--primary))" 
                  name="New Members"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Event Participation Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Event Participation</CardTitle>
            <CardDescription>Registration vs attendance comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.event_participation}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="event_title" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="registered" fill="hsl(var(--primary))" name="Registered" />
                <Bar dataKey="attended" fill="hsl(var(--secondary))" name="Attended" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <BottomNav />
    </div>
  );
};

export default ClubAnalytics;
