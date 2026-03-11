import { useQuery } from "@tanstack/react-query";
import { Settings as SettingsIcon } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import UserInfoCard from "@/components/profile/UserInfoCard";
import ShopInfoCard from "@/components/profile/ShopInfoCard";
import ShopLocationCard from "@/components/profile/ShopLocationCard";
import AppInfoCard from "@/components/profile/AppInfoCard";
import ActionsCard from "@/components/profile/ActionsCard";
import PaymentQRCard from "@/components/profile/PaymentQRCard";

const Settings = () => {
  const { user, isGuest } = useAuth();

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
    enabled: !!user?.id && !isGuest,
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-4 px-4 shadow-lg">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <SettingsIcon className="w-6 h-6" />
            Profile
          </h1>
          {isGuest && (
            <span className="text-xs bg-primary-foreground/20 px-2 py-1 rounded">
              Guest Mode
            </span>
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* 1. User Information */}
        <UserInfoCard />

        {/* 2. Shop Information */}
        <ShopInfoCard profile={profile} />

        {/* 3. Shop Location */}
        <ShopLocationCard profile={profile} />

        {/* 4. App Information */}
        <AppInfoCard />

        {/* 5. Actions */}
        <ActionsCard />

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground pt-4">
          This app is made using Lovable AI
        </p>
      </div>

      <BottomNav />
    </div>
  );
};

export default Settings;
