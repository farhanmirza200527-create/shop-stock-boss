import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

const AppInfoCard = () => {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Info className="w-5 h-5 text-primary" />
          App Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-muted">
            <span className="text-muted-foreground">App Name</span>
            <span className="font-semibold">My Manager</span>
          </div>
          <div className="flex justify-between py-2 border-b border-muted">
            <span className="text-muted-foreground">Version</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Made using</span>
            <span className="font-medium">Lovable AI</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppInfoCard;
