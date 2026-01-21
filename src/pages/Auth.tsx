import React from "react";
import { useNavigate } from "react-router-dom";
import { Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const Auth = () => {
  const navigate = useNavigate();
  const { setGuestMode } = useAuth();

  const handleSkipForNow = () => {
    setGuestMode(true);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* App Icon */}
        <div className="w-24 h-24 bg-foreground rounded-full flex items-center justify-center mb-5">
          <Store className="w-14 h-14 text-background" />
        </div>

        {/* App Name */}
        <h1 className="text-3xl font-bold text-foreground mb-2">My Manager</h1>

        {/* Tagline */}
        <p className="text-muted-foreground text-base mb-10">
          Smart stock & billing manager
        </p>

        {/* Login Button */}
        <Button 
          className="w-full h-12 text-base mb-3"
          onClick={() => navigate("/login")}
        >
          Login
        </Button>

        {/* Sign Up Button */}
        <Button 
          variant="outline"
          className="w-full h-12 text-base mb-3"
          onClick={() => navigate("/signup")}
        >
          Sign Up
        </Button>

        {/* Skip for Now Button */}
        <Button 
          variant="ghost"
          className="w-full h-12 text-base text-muted-foreground"
          onClick={handleSkipForNow}
        >
          Skip for now
        </Button>

        {/* Guest Mode Note */}
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Guest data is stored locally and will be lost if you clear browser data
        </p>

        {/* Spacer */}
        <div className="flex-1 min-h-[60px]" />

        {/* Footer */}
        <p className="text-sm text-muted-foreground mt-auto">
          This app is made using Lovable AI
        </p>
      </div>
    </div>
  );
};

export default Auth;
