import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface Club {
  id: string;
  name: string;
  description: string | null;
  category: string;
  banner_url: string | null;
  faculty_coordinator: string | null;
  created_by: string;
}

const categories = ['cultural', 'technical', 'sports'];

const ClubManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'cultural',
    banner_url: '',
    faculty_coordinator: '',
  });

  useEffect(() => {
    fetchClubs();
  }, [user]);

  const fetchClubs = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data } = await supabase
      .from('clubs')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setClubs(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingClub) {
        // Update existing club
        const { error } = await supabase
          .from('clubs')
          .update({
            name: formData.name,
            description: formData.description,
            category: formData.category as 'cultural' | 'technical' | 'sports',
            banner_url: formData.banner_url || null,
            faculty_coordinator: formData.faculty_coordinator || null,
          })
          .eq('id', editingClub.id);

        if (error) throw error;
        
        toast({ title: 'Club updated successfully' });
        setEditingClub(null);
      } else {
        // Create new club
        const { error } = await supabase
          .from('clubs')
          .insert([{
            name: formData.name,
            description: formData.description,
            category: formData.category as 'cultural' | 'technical' | 'sports',
            banner_url: formData.banner_url || null,
            faculty_coordinator: formData.faculty_coordinator || null,
            created_by: user.id,
          }]);

        if (error) throw error;
        
        toast({ title: 'Club created successfully' });
        setIsCreateOpen(false);
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        category: 'cultural',
        banner_url: '',
        faculty_coordinator: '',
      });

      fetchClubs();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (club: Club) => {
    setEditingClub(club);
    setFormData({
      name: club.name,
      description: club.description || '',
      category: club.category,
      banner_url: club.banner_url || '',
      faculty_coordinator: club.faculty_coordinator || '',
    });
  };

  const handleDelete = async (clubId: string) => {
    try {
      const { error } = await supabase
        .from('clubs')
        .delete()
        .eq('id', clubId);

      if (error) throw error;

      toast({ title: 'Club deleted successfully' });
      fetchClubs();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const ClubForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Club Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="Enter club name"
        />
      </div>

      <div>
        <Label htmlFor="category">Category *</Label>
        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat} className="capitalize">
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter club description"
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="banner_url">Banner Image URL</Label>
        <Input
          id="banner_url"
          type="url"
          value={formData.banner_url}
          onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })}
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div>
        <Label htmlFor="faculty_coordinator">Faculty Coordinator</Label>
        <Input
          id="faculty_coordinator"
          value={formData.faculty_coordinator}
          onChange={(e) => setFormData({ ...formData, faculty_coordinator: e.target.value })}
          placeholder="Enter faculty coordinator name"
        />
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setIsCreateOpen(false);
            setEditingClub(null);
            setFormData({
              name: '',
              description: '',
              category: 'cultural',
              banner_url: '',
              faculty_coordinator: '',
            });
          }}
        >
          Cancel
        </Button>
        <Button type="submit">
          {editingClub ? 'Update Club' : 'Create Club'}
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <div className="min-h-screen bg-background pb-6">
      <header className="bg-gradient-to-br from-primary to-primary-dark text-primary-foreground p-6 rounded-b-3xl shadow-xl mb-6">
        <div className="flex items-center justify-between mb-4">
          <Link to="/clubs">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold">Manage Clubs</h1>
        <p className="text-primary-foreground/80 mt-2">Create, edit, and manage your clubs</p>
      </header>

      <div className="px-6">
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="w-full mb-6 shadow-lg">
              <Plus className="h-5 w-5 mr-2" />
              Create New Club
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Club</DialogTitle>
            </DialogHeader>
            <ClubForm />
          </DialogContent>
        </Dialog>

        {loading ? (
          <p className="text-center text-muted-foreground">Loading...</p>
        ) : clubs.length > 0 ? (
          <div className="space-y-4">
            {clubs.map((club) => (
              <Card key={club.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/3 h-48 overflow-hidden">
                    <img
                      src={club.banner_url || 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=400&fit=crop'}
                      alt={club.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="md:w-2/3 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold mb-1">{club.name}</h3>
                        <span className="text-sm text-muted-foreground capitalize">{club.category}</span>
                      </div>
                      <div className="flex gap-2">
                        <Dialog open={editingClub?.id === club.id} onOpenChange={(open) => !open && setEditingClub(null)}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEdit(club)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit Club</DialogTitle>
                            </DialogHeader>
                            <ClubForm />
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/10">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Club</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{club.name}"? This action cannot be undone and will remove all associated events and members.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(club.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <p className="text-muted-foreground line-clamp-2 mb-3">
                      {club.description || 'No description provided'}
                    </p>
                    {club.faculty_coordinator && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Coordinator:</span> {club.faculty_coordinator}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">You haven't created any clubs yet</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Club
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ClubManagement;
