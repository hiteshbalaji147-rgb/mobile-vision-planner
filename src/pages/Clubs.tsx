import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { BottomNav } from '@/components/BottomNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Users, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

interface Club {
  id: string;
  name: string;
  description: string | null;
  category: string;
  banner_url: string | null;
  faculty_coordinator: string | null;
}

interface Membership {
  club_id: string;
  status: string;
}

const categories = ['all', 'cultural', 'technical', 'sports'];

const Clubs = () => {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchClubs();
    if (user) {
      fetchMemberships();
    }
  }, [selectedCategory, user]);

  const fetchClubs = async () => {
    setLoading(true);
    
    let query = supabase
      .from('clubs')
      .select('*');

    if (selectedCategory !== 'all') {
      query = query.eq('category', selectedCategory as any);
    }

    const { data } = await query.order('created_at', { ascending: false });

    if (data) {
      setClubs(data);
    }

    setLoading(false);
  };

  const fetchMemberships = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('club_members')
      .select('club_id, status')
      .eq('user_id', user.id);

    if (data) {
      setMemberships(data);
    }
  };

  const filteredClubs = clubs.filter(club =>
    club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    club.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-gradient-to-br from-primary to-primary-dark text-primary-foreground p-6 rounded-b-3xl shadow-xl">
        <h1 className="text-3xl font-bold mb-4">Clubs Directory</h1>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search clubs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white h-12 text-base shadow-sm"
          />
        </div>

        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? 'default' : 'secondary'}
              className="cursor-pointer capitalize whitespace-nowrap px-4 py-2 text-sm font-semibold hover:scale-105 transition-transform"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      </header>

      <main className="p-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-96 rounded-xl" />
            ))}
          </div>
        ) : filteredClubs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClubs.map((club) => {
              const isMember = memberships?.some(m => m.club_id === club.id && m.status === 'approved');
              
              return (
                <Card key={club.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={club.banner_url || 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=400&fit=crop'}
                      alt={club.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-primary/90 text-primary-foreground shadow-lg font-semibold capitalize px-3 py-1">
                        {club.category}
                      </Badge>
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl">{club.name}</CardTitle>
                    <CardDescription className="line-clamp-2 text-base mt-2">
                      {club.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {club.faculty_coordinator && (
                      <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="font-medium">Coordinator:</span> {club.faculty_coordinator}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Link to={`/clubs/${club.id}`} className="flex-1">
                        <Button variant="outline" className="w-full border-2" size="lg">
                          <Users className="h-4 w-4 mr-2" />
                          Explore
                        </Button>
                      </Link>
                      {isMember ? (
                        <Button variant="secondary" disabled className="flex-1" size="lg">
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Joined
                        </Button>
                      ) : (
                        <Link to={`/clubs/${club.id}`} className="flex-1">
                          <Button variant="default" className="w-full shadow-md" size="lg">
                            Join Now
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-2">
            <CardContent className="p-8 text-center text-muted-foreground">
              <p className="text-lg">No clubs found</p>
              <p className="text-sm mt-2">Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Clubs;