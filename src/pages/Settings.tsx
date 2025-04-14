
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Lock } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Link } from "react-router-dom";

const Settings = () => {
  const { isAuthenticated } = useAuth();
  const [settings, setSettings] = useState({
    notifications: true,
    emailUpdates: false,
    darkMode: false,
    autoSave: true,
    showSteps: true,
    visualizations: true,
    latexOutput: true,
  });
  
  const handleToggleSetting = (key: keyof typeof settings) => {
    setSettings({
      ...settings,
      [key]: !settings[key],
    });
    
    toast.success("Setting updated", {
      description: `${key} has been ${settings[key] ? "disabled" : "enabled"}.`
    });
  };
  
  if (!isAuthenticated) {
    return (
      <div className="container py-12">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Settings Access Restricted</h1>
          <p className="text-muted-foreground mb-6">
            Please log in to access settings.
          </p>
          <Link to="/">
            <Button>Back to Solver</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>
        
        <Tabs defaultValue="preferences" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preferences" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Display Settings</CardTitle>
                <CardDescription>Control how Math Wizard looks and behaves</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="dark-mode">Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Switch between light and dark theme
                    </p>
                  </div>
                  <Switch
                    id="dark-mode"
                    checked={settings.darkMode}
                    onCheckedChange={() => handleToggleSetting("darkMode")}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-steps">Show Step-by-Step Solutions</Label>
                    <p className="text-sm text-muted-foreground">
                      Always show detailed steps for solutions
                    </p>
                  </div>
                  <Switch
                    id="show-steps"
                    checked={settings.showSteps}
                    onCheckedChange={() => handleToggleSetting("showSteps")}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="visualizations">Enable Visualizations</Label>
                    <p className="text-sm text-muted-foreground">
                      Show graphs and visual aids when applicable
                    </p>
                  </div>
                  <Switch
                    id="visualizations"
                    checked={settings.visualizations}
                    onCheckedChange={() => handleToggleSetting("visualizations")}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="latex-output">LaTeX Output</Label>
                    <p className="text-sm text-muted-foreground">
                      Include LaTeX representation in solutions
                    </p>
                  </div>
                  <Switch
                    id="latex-output"
                    checked={settings.latexOutput}
                    onCheckedChange={() => handleToggleSetting("latexOutput")}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="account" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-save">Auto-Save Solutions</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically save solutions to history
                    </p>
                  </div>
                  <Switch
                    id="auto-save"
                    checked={settings.autoSave}
                    onCheckedChange={() => handleToggleSetting("autoSave")}
                  />
                </div>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Password</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Last updated 30 days ago
                    </span>
                    <Button variant="outline" size="sm">Change Password</Button>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Connected Accounts</h3>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      <span className="text-sm">Google</span>
                    </div>
                    <Button variant="ghost" size="sm">Disconnect</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible actions for your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive">Delete Account</Button>
                <p className="text-sm text-muted-foreground mt-2">
                  This will permanently delete your account and all associated data.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="privacy" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>Manage your data and privacy preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notifications">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications for new features and updates
                    </p>
                  </div>
                  <Switch
                    id="notifications"
                    checked={settings.notifications}
                    onCheckedChange={() => handleToggleSetting("notifications")}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-updates">Email Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive emails about new features and tips
                    </p>
                  </div>
                  <Switch
                    id="email-updates"
                    checked={settings.emailUpdates}
                    onCheckedChange={() => handleToggleSetting("emailUpdates")}
                  />
                </div>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Data Usage</h3>
                  <div className="flex flex-col gap-2">
                    <div className="bg-muted/30 p-4 rounded-lg flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">
                        Your math problems are processed using GROQ's API. No data is stored on our servers beyond 
                        your solution history. You can delete your history at any time from your account.
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="w-fit">
                      Download My Data
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
