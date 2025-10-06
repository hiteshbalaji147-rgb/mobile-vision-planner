import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points_required: number;
  badge_type: string;
  earned_at?: string;
}

const UserAchievements = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    if (user) {
      fetchAchievements();
      fetchTotalPoints();
    }
  }, [user]);

  const fetchAchievements = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("user_achievements")
      .select(`
        earned_at,
        achievements (
          id,
          name,
          description,
          icon,
          points_required,
          badge_type
        )
      `)
      .eq("user_id", user.id);

    if (data) {
      setAchievements(
        data.map((item: any) => ({
          ...item.achievements,
          earned_at: item.earned_at,
        }))
      );
    }
  };

  const fetchTotalPoints = async () => {
    if (!user) return;

    const { data } = await supabase.rpc("get_user_total_points", {
      _user_id: user.id,
    });

    if (data !== null) {
      setTotalPoints(data);
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case "bronze": return "bg-amber-700 text-white";
      case "silver": return "bg-slate-400 text-white";
      case "gold": return "bg-amber-500 text-white";
      case "platinum": return "bg-gradient-to-r from-slate-700 to-slate-500 text-white";
      default: return "bg-secondary";
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Total Points</h3>
            <p className="text-3xl font-bold mt-2">{totalPoints}</p>
          </div>
          <Trophy className="h-12 w-12 text-accent" />
        </div>
      </Card>

      <div>
        <h3 className="text-lg font-semibold mb-3">Your Achievements</h3>
        {achievements.length === 0 ? (
          <p className="text-muted-foreground">No achievements yet. Keep participating!</p>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {achievements.map((achievement) => (
              <Card key={achievement.id} className="p-4">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{achievement.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {achievement.description}
                    </p>
                  </div>
                  <Badge className={getBadgeColor(achievement.badge_type)}>
                    {achievement.badge_type}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserAchievements;
