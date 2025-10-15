import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon, Moon, Sun, Download, Upload } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const [darkMode, setDarkMode] = useState(false);
  const { toast } = useToast();

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
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <SettingsIcon className="w-6 h-6" />
            Settings
          </h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
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
              <p className="font-semibold">Smart Stock & Billing Manager</p>
              <p className="text-muted-foreground">Version 1.0.0</p>
              <p className="text-muted-foreground">
                Mobile Accessories & Repair Shop Management System
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                © 2025 All rights reserved
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default Settings;