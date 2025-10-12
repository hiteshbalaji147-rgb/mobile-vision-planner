import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export const PrivacySettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    profile_visibility: 'public',
    show_email: false,
    show_clubs: true,
    show_events: true,
    show_achievements: true,
  });

  useEffect(() => {
    if (user) {
      fetchPrivacySettings();
    }
  }, [user]);

  const fetchPrivacySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('profile_visibility, show_email, show_clubs, show_events, show_achievements')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setSettings({
          profile_visibility: data.profile_visibility || 'public',
          show_email: data.show_email || false,
          show_clubs: data.show_clubs !== false,
          show_events: data.show_events !== false,
          show_achievements: data.show_achievements !== false,
        });
      }
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load privacy settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: boolean | string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [key]: value })
        .eq('id', user?.id);

      if (error) throw error;

      setSettings((prev) => ({ ...prev, [key]: value }));
      toast({
        title: 'Success',
        description: 'Privacy setting updated',
      });
    } catch (error) {
      console.error('Error updating privacy setting:', error);
      toast({
        title: 'Error',
        description: 'Failed to update privacy setting',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy Settings</CardTitle>
        <CardDescription>Control who can see your information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-visibility">Profile Visibility</Label>
            <Select
              value={settings.profile_visibility}
              onValueChange={(value) => updateSetting('profile_visibility', value)}
              disabled={saving}
            >
              <SelectTrigger id="profile-visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public - Everyone can view</SelectItem>
                <SelectItem value="members">Members Only - Only club members</SelectItem>
                <SelectItem value="private">Private - Only you</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div className="flex-1">
              <Label htmlFor="show-email">Show Email Address</Label>
              <p className="text-sm text-muted-foreground">
                Allow others to see your email address
              </p>
            </div>
            <Switch
              id="show-email"
              checked={settings.show_email}
              onCheckedChange={(checked) => updateSetting('show_email', checked)}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div className="flex-1">
              <Label htmlFor="show-clubs">Show Joined Clubs</Label>
              <p className="text-sm text-muted-foreground">
                Display clubs you've joined on your profile
              </p>
            </div>
            <Switch
              id="show-clubs"
              checked={settings.show_clubs}
              onCheckedChange={(checked) => updateSetting('show_clubs', checked)}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div className="flex-1">
              <Label htmlFor="show-events">Show Event Attendance</Label>
              <p className="text-sm text-muted-foreground">
                Display events you've attended
              </p>
            </div>
            <Switch
              id="show-events"
              checked={settings.show_events}
              onCheckedChange={(checked) => updateSetting('show_events', checked)}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div className="flex-1">
              <Label htmlFor="show-achievements">Show Achievements</Label>
              <p className="text-sm text-muted-foreground">
                Display your earned achievements and badges
              </p>
            </div>
            <Switch
              id="show-achievements"
              checked={settings.show_achievements}
              onCheckedChange={(checked) => updateSetting('show_achievements', checked)}
              disabled={saving}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
