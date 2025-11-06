import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, UserCog } from 'lucide-react';
import { toast } from 'sonner';

interface Member {
  user_id: string;
  role: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface RoleManagementProps {
  clubId: string;
}

const roleOptions = [
  { value: 'member', label: 'Member', description: 'Basic club member' },
  { value: 'secretary', label: 'Secretary', description: 'Can manage events and members' },
  { value: 'president', label: 'President', description: 'Full club management access' },
  { value: 'faculty_coordinator', label: 'Faculty Coordinator', description: 'Faculty oversight' },
];

const RoleManagement = ({ clubId }: RoleManagementProps) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, [clubId]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      
      // Fetch roles and user_ids
      const { data: roles, error: rolesError } = await supabase
        .from('club_roles')
        .select('user_id, role')
        .eq('club_id', clubId)
        .order('role');

      if (rolesError) throw rolesError;

      if (!roles || roles.length === 0) {
        setMembers([]);
        return;
      }

      // Fetch profiles for these users
      const userIds = roles.map(r => r.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Merge the data
      const membersData = roles.map(role => {
        const profile = profiles?.find(p => p.id === role.user_id);
        return {
          user_id: role.user_id,
          role: role.role,
          profiles: {
            full_name: profile?.full_name || 'Unknown',
            avatar_url: profile?.avatar_url || null,
          },
        };
      });

      setMembers(membersData as Member[]);
    } catch (error: any) {
      toast.error('Failed to load members');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (userId: string, newRole: 'president' | 'secretary' | 'faculty_coordinator' | 'member') => {
    try {
      // Validate role
      const validRoles = ['president', 'secretary', 'faculty_coordinator', 'member'];
      if (!validRoles.includes(newRole)) {
        toast.error('Invalid role selected');
        return;
      }

      const { error } = await supabase
        .from('club_roles')
        .update({ role: newRole })
        .eq('club_id', clubId)
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Role updated successfully');
      fetchMembers();
    } catch (error: any) {
      toast.error('Failed to update role');
      console.error('Error:', error);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      president: 'bg-primary',
      secretary: 'bg-secondary',
      faculty_coordinator: 'bg-accent',
      member: 'bg-muted',
    };
    return colors[role] || 'bg-muted';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <CardTitle>Role Management</CardTitle>
        </div>
        <CardDescription>
          Manage member roles and permissions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {members.map(member => (
          <div key={member.user_id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={member.profiles?.avatar_url || ''} />
                <AvatarFallback>
                  {member.profiles?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{member.profiles?.full_name || 'Unknown'}</p>
                <Badge className={getRoleBadgeColor(member.role)}>
                  {roleOptions.find(r => r.value === member.role)?.label || member.role}
                </Badge>
              </div>
            </div>
            <Select
              value={member.role}
              onValueChange={(newRole) => updateRole(member.user_id, newRole as 'president' | 'secretary' | 'faculty_coordinator' | 'member')}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <p className="font-medium">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
        {members.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No members with assigned roles yet
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RoleManagement;
