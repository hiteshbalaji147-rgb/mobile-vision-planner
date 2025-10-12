import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { AppQRCode } from '@/components/AppQRCode';

const Settings = () => {
  return (
    <div className="min-h-screen bg-background pb-6">
      <header className="bg-primary text-primary-foreground p-6 rounded-b-3xl shadow-lg mb-6">
        <div className="flex items-center mb-4">
          <Link to="/profile">
            <Button variant="ghost" size="icon" className="text-primary-foreground mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
      </header>

      <main className="px-6 space-y-6">
        <AppQRCode />
        
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Notification settings coming soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Privacy Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Privacy settings coming soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">ClubTuner v1.0.0</p>
            <p className="text-sm text-muted-foreground mt-2">
              College club management made simple
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Settings;