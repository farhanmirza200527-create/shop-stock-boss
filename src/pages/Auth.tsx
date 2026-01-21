import React from "react";
import { useNavigate } from "react-router-dom";
import { Store } from "lucide-react";
import { Button } from "@/components/ui/button";

const Auth = () => {
  const navigate = useNavigate();

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
          className="w-full h-12 text-base mb-5"
          onClick={() => navigate("/signup")}
        >
          Sign Up
        </Button>

        {/* Skip for Now */}
        <Button
          variant="link"
          className="text-base text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/")}
        >
          Skip for now
        </Button>

        {/* Spacer */}
        <div className="flex-1 min-h-[100px]" />

        {/* Footer */}
        <p className="text-sm text-muted-foreground mt-auto">
          This app is made using Lovable AI
        </p>
      </div>
    </div>
  );
};

export default Auth;
