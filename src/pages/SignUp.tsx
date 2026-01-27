import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  getGenericAuthMessage,
  checkRateLimit,
  recordFailedAttempt,
  clearRateLimit,
  formatLockoutTime,
  getRemainingAttempts,
} from "@/lib/auth-security";

const SignUp = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);

  // Rate limit key based on email (or session if no email)
  const getRateLimitKey = () => `signup_${email.trim().toLowerCase() || 'session'}`;

  // Check lockout status on mount and when email changes
  useEffect(() => {
    const remaining = checkRateLimit(getRateLimitKey());
    setLockoutTime(remaining);
    
    if (remaining > 0) {
      const interval = setInterval(() => {
        const newRemaining = checkRateLimit(getRateLimitKey());
        setLockoutTime(newRemaining);
        if (newRemaining <= 0) clearInterval(interval);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [email]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shopName.trim() || !email.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    // Check rate limit before attempting
    const rateLimitKey = getRateLimitKey();
    const currentLockout = checkRateLimit(rateLimitKey);
    if (currentLockout > 0) {
      toast({
        title: "Too Many Attempts",
        description: `Please wait ${formatLockoutTime(currentLockout)} before trying again`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            shop_name: shopName.trim(),
          },
        },
      });

      if (error) {
        // Record failed attempt and check for new lockout
        const lockoutDuration = recordFailedAttempt(rateLimitKey);
        const remaining = getRemainingAttempts(rateLimitKey);
        
        // Use generic error message to prevent enumeration
        const genericMessage = getGenericAuthMessage(error.message, 'signup');
        
        if (lockoutDuration > 0) {
          setLockoutTime(lockoutDuration);
          toast({
            title: "Too Many Attempts",
            description: `Please wait ${formatLockoutTime(lockoutDuration)} before trying again`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sign Up Failed",
            description: remaining > 0 
              ? `${genericMessage} ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
              : genericMessage,
            variant: "destructive",
          });
        }
      } else {
        // Clear rate limit on success
        clearRateLimit(rateLimitKey);
        toast({
          title: "Account Created!",
          description: "Welcome to My Manager!",
        });
        navigate("/");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isLocked = lockoutTime > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        <Button variant="ghost" size="icon" onClick={() => navigate("/auth")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold ml-2">Sign Up</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSignUp} className="p-6 space-y-6">
        {isLocked && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
            <p className="text-sm text-destructive font-medium">
              Too many attempts. Please wait {formatLockoutTime(lockoutTime)}.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="shopName">Shop Name</Label>
          <Input
            id="shopName"
            type="text"
            placeholder="Enter your shop name"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            disabled={isLoading || isLocked}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading || isLocked}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading || isLocked}
          />
        </div>

        <Button 
          type="submit" 
          className="w-full h-12"
          disabled={isLoading || isLocked}
        >
          {isLoading ? "Creating Account..." : isLocked ? `Locked (${formatLockoutTime(lockoutTime)})` : "Create Account"}
        </Button>
      </form>
    </div>
  );
};

export default SignUp;
