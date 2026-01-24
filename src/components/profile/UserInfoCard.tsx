import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const UserInfoCard = () => {
  const { user, isGuest } = useAuth();

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          User Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <Mail className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Email ID</p>
            <p className="font-medium">{isGuest ? "Guest" : user?.email || "Not set"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <User className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Account Type</p>
            <p className="font-medium">{isGuest ? "Guest User" : "Logged-in User"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserInfoCard;
