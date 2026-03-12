import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ActionsCard = () => {
  const { user, isGuest, setGuestMode } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showResetDialog, setShowResetDialog] = useState(false);

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

  const handleResetApp = () => {
    // Clear only local data
    localStorage.removeItem("guestMode");
    localStorage.removeItem("guestProducts");
    localStorage.removeItem("guestBills");
    localStorage.removeItem("guestRepairs");
    localStorage.removeItem("guestCategories");
    localStorage.removeItem("guestShopInfo");
    localStorage.removeItem("guestShopLocation");

    toast({
      title: "App Reset",
      description: "Local data has been cleared",
    });
    setShowResetDialog(false);

    if (isGuest) {
      setGuestMode(false);
      navigate("/auth");
    }
  };

  return (
    <>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!isGuest && (
            <Button
              onClick={handleLogout}
              className="w-full justify-start"
              variant="destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          )}

          {isGuest && (
            <Button
              onClick={handleLogout}
              className="w-full justify-start"
              variant="outline"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Exit Guest Mode
            </Button>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default ActionsCard;
