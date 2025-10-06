import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { BottomNav } from '@/components/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Settings } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import UserAchievements from '@/components/UserAchievements';

interface Profile {
  full_name: string;
  email: string;
  avatar_url: string | null;
}

interface Club {
  clubs: {
    id: string;
    name: string;
    category: string;
  };
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUserClubs();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      setProfile(data);
    }
    setLoading(false);
  };

  const fetchUserClubs = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('club_members')
      .select('clubs(id, name, category)')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (data) {
      setClubs(data);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="p-6 space-y-6">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-primary text-primary-foreground p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary-foreground">
              <AvatarFallback className="bg-accent text-accent-foreground text-lg">
                {profile ? getInitials(profile.full_name) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{profile?.full_name || 'User'}</h1>
              <p className="text-primary-foreground/80 text-sm">{profile?.email}</p>
            </div>
          </div>
          <Link to="/settings">
            <Button variant="ghost" size="icon" className="text-primary-foreground">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="p-6 space-y-6">
        <UserAchievements />

        <Card>
          <CardHeader>
            <CardTitle>My Clubs</CardTitle>
          </CardHeader>
          <CardContent>
            {clubs.length > 0 ? (
              <div className="space-y-2">
                {clubs.map((membership) => (
                  <Link
                    key={membership.clubs.id}
                    to={`/clubs/${membership.clubs.id}`}
                    className="block p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <h3 className="font-semibold">{membership.clubs.name}</h3>
                    <p className="text-sm text-muted-foreground capitalize">
                      {membership.clubs.category}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                You haven't joined any clubs yet
              </p>
            )}
          </CardContent>
        </Card>

        <Button
          variant="destructive"
          className="w-full"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;