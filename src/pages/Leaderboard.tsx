import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Users, Calendar } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

interface LeaderboardEntry {
  id: string;
  full_name: string;
  avatar_url: string | null;
  total_points: number;
  clubs_joined: number;
  events_attended: number;
  achievements_earned: number;
}

const Leaderboard = () => {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_leaderboard");
    
    if (!error && data) {
      setLeaders(data);
    }
    setLoading(false);
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-6 w-6 text-amber-500" />;
    if (index === 1) return <Trophy className="h-6 w-6 text-slate-400" />;
    if (index === 2) return <Trophy className="h-6 w-6 text-amber-700" />;
    return <Star className="h-5 w-5 text-muted-foreground" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="animate-pulse p-6">Loading...</div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground p-6 rounded-b-3xl shadow-xl">
        <h1 className="text-2xl font-bold mb-2">Leaderboard</h1>
        <p className="text-primary-foreground/90">Top performers in the community</p>
      </header>

      <div className="p-4 space-y-3 mt-4">
        {leaders.map((leader, index) => (
          <Card key={leader.id} className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 text-center">
                {getRankIcon(index)}
                <div className="text-sm font-semibold text-muted-foreground mt-1">
                  #{index + 1}
                </div>
              </div>

              <Avatar className="h-12 w-12">
                <AvatarImage src={leader.avatar_url || undefined} />
                <AvatarFallback>{leader.full_name[0]}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">
                  {leader.full_name}
                </h3>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{leader.clubs_joined}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{leader.events_attended}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <Badge variant="secondary" className="font-bold">
                  {leader.total_points} pts
                </Badge>
                <div className="text-xs text-muted-foreground">
                  {leader.achievements_earned} badges
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default Leaderboard;
