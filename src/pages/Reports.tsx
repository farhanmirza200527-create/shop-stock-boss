import BottomNav from "@/components/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

const Reports = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-4 px-4 shadow-lg">
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold">Reports & Records</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Reports Feature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Reports and analytics will be available here. You'll be able to view:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
              <li>Sales history and trends</li>
              <li>Inventory movement reports</li>
              <li>Low stock alerts</li>
              <li>Revenue analytics</li>
              <li>Customer transaction history</li>
              <li>Export data to Excel/PDF</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default Reports;