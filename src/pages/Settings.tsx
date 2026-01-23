import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon, Moon, Sun, Download, Upload, LogOut, User, Store, Mail } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const Settings = () => {
  const [darkMode, setDarkMode] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isGuest, setGuestMode } = useAuth();

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }
      return data;
    },
    enabled: !!user?.id,
  });

  const handleLogout = async () => {
    if (isGuest) {
      setGuestMode(false);
      toast({
        title: "Guest Mode Ended",
        description: "Your guest data will be preserved until you clear browser data",
      });
      navigate("/auth");
    } else {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Error",
          description: "Failed to sign out",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Signed Out",
          description: "You have been signed out successfully",
        });
        navigate("/auth");
      }
    }
  };

  const handleThemeToggle = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
    toast({
      title: darkMode ? "Light Mode" : "Dark Mode",
      description: `Switched to ${darkMode ? "light" : "dark"} mode`,
    });
  };

  const handleBackup = () => {
    toast({
      title: "Backup Started",
      description: "Your data backup is being prepared...",
    });
    // Backup logic would go here
  };

  const handleRestore = () => {
    toast({
      title: "Restore",
      description: "Please select a backup file to restore",
    });
    // Restore logic would go here
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-4 px-4 shadow-lg">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <SettingsIcon className="w-6 h-6" />
            Settings
          </h1>
          {isGuest && (
            <span className="text-xs bg-primary-foreground/20 px-2 py-1 rounded">
              Guest Mode
            </span>
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Profile Info */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isGuest ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Guest User</p>
                    <p className="text-sm text-muted-foreground">Data stored locally on this device</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate("/auth")}
                >
                  Sign up to sync your data
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Store className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Shop Name</p>
                    <p className="font-medium">{profile?.shop_name || "Not set"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Mail className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user?.email || profile?.email || "Not set"}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Appearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">Toggle dark theme</p>
                </div>
              </div>
              <Switch checked={darkMode} onCheckedChange={handleThemeToggle} />
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Data Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={handleBackup} 
              className="w-full justify-start"
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Backup Data
            </Button>
            <Button 
              onClick={handleRestore} 
              className="w-full justify-start"
              variant="outline"
            >
              <Upload className="w-4 h-4 mr-2" />
              Restore Data
            </Button>
          </CardContent>
        </Card>

        {/* About */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">About</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p className="font-semibold">My Manager</p>
              <p className="text-muted-foreground">Version 1.0.0</p>
              <p className="text-muted-foreground">
                Smart Stock & Billing - Mobile Accessories & Repair Manager
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                © 2025 All rights reserved
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Account</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleLogout} 
              className="w-full justify-start"
              variant="destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {isGuest ? "Exit Guest Mode" : "Sign Out"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default Settings;