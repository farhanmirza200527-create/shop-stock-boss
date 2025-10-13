import BottomNav from "@/components/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt } from "lucide-react";

const Billing = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-4 px-4 shadow-lg">
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold">Billing</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Billing Feature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Billing functionality will be implemented here. This will allow you to:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
              <li>Create customer bills</li>
              <li>Select products from inventory</li>
              <li>Calculate totals with taxes</li>
              <li>Generate PDF invoices</li>
              <li>Track payment status</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default Billing;