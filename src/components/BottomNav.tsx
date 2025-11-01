import { Home, Users, Calendar, Trophy, User, LayoutDashboard } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const baseNavItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Users, label: 'Clubs', path: '/clubs' },
  { icon: Calendar, label: 'Events', path: '/events' },
  { icon: Trophy, label: 'Ranks', path: '/leaderboard' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export const BottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [hasLeadershipRole, setHasLeadershipRole] = useState(false);

  useEffect(() => {
    if (user) {
      checkLeadershipRole();
    }
  }, [user]);

  const checkLeadershipRole = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('club_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['president', 'secretary', 'faculty_coordinator'])
      .limit(1);

    setHasLeadershipRole(!!data && data.length > 0);
  };

  const navItems = hasLeadershipRole
    ? [
        { icon: Home, label: 'Home', path: '/' },
        { icon: LayoutDashboard, label: 'Manage', path: '/manage-clubs' },
        { icon: Calendar, label: 'Events', path: '/events' },
        { icon: Trophy, label: 'Ranks', path: '/leaderboard' },
        { icon: User, label: 'Profile', path: '/profile' },
      ]
    : baseNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 shadow-lg">
      <div className="flex justify-around items-center h-14 max-w-screen-xl mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                isActive
                  ? "text-accent"
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};