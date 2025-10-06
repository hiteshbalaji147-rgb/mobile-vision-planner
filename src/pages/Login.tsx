import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      loginSchema.parse({ email, password });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: error.errors[0].message,
          variant: 'destructive',
        });
        return;
      }
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      toast({
        title: 'Login Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      navigate('/');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-muted p-4">
      <Card className="w-full max-w-md shadow-xl border-border/50 overflow-hidden">
        <div className="bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground p-8 text-center">
          <h1 className="text-4xl font-bold mb-2">ClubTuner</h1>
          <p className="text-primary-foreground/90 text-sm">Discover & Connect with Campus Clubs</p>
        </div>
        
        <CardHeader className="space-y-1 text-center pt-6">
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>Login to continue your journey</CardDescription>
        </CardHeader>
        
        <CardContent className="px-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">College Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-border bg-background focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-border bg-background focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md h-11 font-semibold" 
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-3 pb-8 px-8 pt-2">
          <Link 
            to="/forgot-password" 
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Forgot Password?
          </Link>
          <div className="pt-4 border-t border-border w-full text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary hover:text-primary/80 font-semibold transition-colors">
                Sign Up
              </Link>
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;