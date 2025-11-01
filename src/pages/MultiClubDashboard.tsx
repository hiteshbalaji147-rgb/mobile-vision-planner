import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BottomNav } from '@/components/BottomNav';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, AlertCircle, TrendingUp, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface ClubWithRole {
  id: string;
  name: string;
  category: string;
  banner_url: string | null;
  role: string;
  member_count: number;
  upcoming_events: number;
  pending_members: number;
}

const MultiClubDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clubs, setClubs] = useState<ClubWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchManagedClubs();
    }
  }, [user]);

  const fetchManagedClubs = async () => {
    try {
      setLoading(true);
      
      // Fetch clubs where user has a leadership role
      const { data: clubRoles, error: rolesError } = await supabase
        .from('club_roles')
        .select(`
          role,
          clubs (
            id,
            name,
            category,
            banner_url
          )
        `)
        .eq('user_id', user?.id)
        .in('role', ['president', 'secretary', 'faculty_coordinator']);

      if (rolesError) throw rolesError;

      // Get additional stats for each club
      const clubsWithStats = await Promise.all(
        (clubRoles || []).map(async (cr: any) => {
          const club = cr.clubs;
          
          // Get member count
          const { count: memberCount } = await supabase
            .from('club_members')
            .select('*', { count: 'exact', head: true })
            .eq('club_id', club.id)
            .eq('status', 'active');

          // Get upcoming events count
          const { count: eventsCount } = await supabase
            .from('events')
            .select('*', { count: 'exact', head: true })
            .eq('club_id', club.id)
            .gte('event_date', new Date().toISOString());

          // Get pending members count
          const { count: pendingCount } = await supabase
            .from('club_members')
            .select('*', { count: 'exact', head: true })
            .eq('club_id', club.id)
            .eq('status', 'pending');

          return {
            ...club,
            role: cr.role,
            member_count: memberCount || 0,
            upcoming_events: eventsCount || 0,
            pending_members: pendingCount || 0,
          };
        })
      );

      setClubs(clubsWithStats);
    } catch (error: any) {
      toast.error('Failed to load clubs');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, { label: string; color: string }> = {
      president: { label: 'President', color: 'bg-primary' },
      secretary: { label: 'Secretary', color: 'bg-secondary' },
      faculty_coordinator: { label: 'Faculty Coordinator', color: 'bg-accent' },
    };
    return roleMap[role] || { label: role, color: 'bg-muted' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="container mx-auto p-4 space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-64" />)}
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (clubs.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="container mx-auto p-4">
          <h1 className="text-3xl font-bold mb-6">Multi-Club Dashboard</h1>
          <Card>
            <CardHeader>
              <CardTitle>No Clubs to Manage</CardTitle>
              <CardDescription>
                You don't have any leadership roles in clubs yet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/clubs')}>Browse Clubs</Button>
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
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Multi-Club Dashboard</h1>
          <Badge variant="outline">{clubs.length} Club{clubs.length !== 1 ? 's' : ''}</Badge>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pending">
              Pending Actions
              {clubs.reduce((sum, c) => sum + c.pending_members, 0) > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {clubs.reduce((sum, c) => sum + c.pending_members, 0)}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clubs.map(club => {
                const roleInfo = getRoleDisplay(club.role);
                return (
                  <Card key={club.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="space-y-3">
                      {club.banner_url && (
                        <img 
                          src={club.banner_url} 
                          alt={club.name}
                          className="w-full h-32 object-cover rounded-md"
                        />
                      )}
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-xl">{club.name}</CardTitle>
                          <Badge className={roleInfo.color}>{roleInfo.label}</Badge>
                        </div>
                        <CardDescription className="capitalize">{club.category}</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{club.member_count} members</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{club.upcoming_events} events</span>
                        </div>
                      </div>

                      {club.pending_members > 0 && (
                        <div className="flex items-center gap-2 text-sm text-orange-600">
                          <AlertCircle className="h-4 w-4" />
                          <span>{club.pending_members} pending approval</span>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => navigate(`/clubs/${club.id}/analytics`)}
                        >
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Analytics
                        </Button>
                        <Button 
                          className="flex-1"
                          onClick={() => navigate(`/clubs/${club.id}`)}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Manage
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {clubs.filter(c => c.pending_members > 0).map(club => (
              <Card key={club.id}>
                <CardHeader>
                  <CardTitle>{club.name}</CardTitle>
                  <CardDescription>{club.pending_members} members awaiting approval</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => navigate(`/clubs/${club.id}`)}>
                    Review Applications
                  </Button>
                </CardContent>
              </Card>
            ))}
            {clubs.every(c => c.pending_members === 0) && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No pending actions at this time.
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <BottomNav />
    </div>
  );
};

export default MultiClubDashboard;
