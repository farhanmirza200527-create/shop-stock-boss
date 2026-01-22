import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, Filter, Trash2, Lock } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useLicense } from "@/hooks/useLicense";
import LicenseBadge from "@/components/LicenseBadge";
import { toast } from "sonner";

const Reports = () => {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const { isGuest } = useAuth();
  const { license, canAccessReports } = useLicense();
  
  const { data: bills } = useQuery({
    queryKey: ["bills"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bills")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !isGuest,
  });

  const { data: repairs } = useQuery({
    queryKey: ["repairs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("repairs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !isGuest,
  });

  const { data: deletedProducts } = useQuery({
    queryKey: ["deleted-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !isGuest,
  });

  // Filter data based on date range
  const filterByDate = (items: any[] | undefined) => {
    if (!items) return [];
    if (!dateRange.from && !dateRange.to) return items;
    
    return items.filter(item => {
      const itemDate = new Date(item.created_at);
      if (dateRange.from && dateRange.to) {
        return itemDate >= dateRange.from && itemDate <= dateRange.to;
      }
      if (dateRange.from) {
        return itemDate >= dateRange.from;
      }
      if (dateRange.to) {
        return itemDate <= dateRange.to;
      }
      return true;
    });
  };

  const filteredBills = filterByDate(bills);
  const filteredRepairs = filterByDate(repairs?.filter(r => r.repair_status === "Completed" || r.repair_status === "Delivered"));

  const handleExport = (data: any[], filename: string) => {
    // LICENSE CHECK: Only ACTIVE users can export
    if (!canAccessReports()) {
      toast.error("Export is a Premium feature. Please upgrade your license.");
      return;
    }
    exportToCSV(data, filename);
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-4 px-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">Reports & History</h1>
          {!isGuest && <LicenseBadge licenseType={license.licenseType} daysRemaining={license.daysRemaining} />}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Date Filter */}
        <Card className="mb-6 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter by Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-left font-normal")}>
                    {dateRange.from ? format(dateRange.from, "PPP") : "From Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-left font-normal")}>
                    {dateRange.to ? format(dateRange.to, "PPP") : "To Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              <Button 
                variant="ghost" 
                onClick={() => setDateRange({})}
              >
                Clear Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="billing" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="billing">Billing History</TabsTrigger>
            <TabsTrigger value="repairs">Repair History</TabsTrigger>
            <TabsTrigger value="deleted">Deleted Products</TabsTrigger>
          </TabsList>

          {/* Billing History Tab */}
          <TabsContent value="billing" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">All Bills ({filteredBills.length})</h2>
              <Button onClick={() => handleExport(filteredBills, 'billing-history')} size="sm">
                {!canAccessReports() && <Lock className="w-3 h-3 mr-1" />}
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {filteredBills.length > 0 ? (
              <div className="space-y-4">
                {filteredBills.map((bill) => (
                  <Card key={bill.id} className="shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold">{bill.customer_name || "Walk-in Customer"}</p>
                          <p className="text-sm text-muted-foreground">{bill.customer_phone || "No phone"}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(bill.created_at), "PPP 'at' pp")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">₹{Number(bill.total_amount).toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">Paid: ₹{Number(bill.paid_amount).toFixed(2)}</p>
                          {Number(bill.balance_amount) > 0 && (
                            <p className="text-sm text-red-600 font-medium">Balance: ₹{Number(bill.balance_amount).toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                      
                      {bill.bill_items && Array.isArray(bill.bill_items) && bill.bill_items.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs font-medium mb-2">Items:</p>
                          <div className="space-y-1">
                            {bill.bill_items.map((item: any, idx: number) => (
                              <p key={idx} className="text-xs text-muted-foreground">
                                {item.productName} × {item.quantity} = ₹{item.subtotal}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">No bills found for selected date range</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Repair History Tab */}
          <TabsContent value="repairs" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Completed Repairs ({filteredRepairs.length})</h2>
              <Button onClick={() => handleExport(filteredRepairs, 'repair-history')} size="sm">
                {!canAccessReports() && <Lock className="w-3 h-3 mr-1" />}
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {filteredRepairs.length > 0 ? (
              <div className="space-y-4">
                {filteredRepairs.map((repair) => (
                  <Card key={repair.id} className="shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold">{repair.customer_name}</p>
                          <p className="text-sm text-muted-foreground">{repair.customer_phone}</p>
                          <p className="text-sm mt-2"><span className="font-medium">Device:</span> {repair.device_model}</p>
                          <p className="text-sm"><span className="font-medium">Problem:</span> {repair.problem_description}</p>
                          {repair.parts_used && (
                            <p className="text-sm"><span className="font-medium">Parts:</span> {repair.parts_used}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Completed: {format(new Date(repair.created_at), "PPP")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-green-600">₹{Number(repair.final_cost).toFixed(2)}</p>
                          <span className="inline-block mt-2 px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                            {repair.repair_status}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">No completed repairs found</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Deleted Products Tab */}
          <TabsContent value="deleted" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Deleted Products ({deletedProducts?.length || 0})</h2>
              <Button onClick={() => handleExport(deletedProducts || [], 'deleted-products')} size="sm">
                {!canAccessReports() && <Lock className="w-3 h-3 mr-1" />}
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {deletedProducts && deletedProducts.length > 0 ? (
              <div className="space-y-4">
                {deletedProducts.map((product) => (
                  <Card key={product.id} className="shadow-sm opacity-75">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <Trash2 className="w-5 h-5 text-red-500 mt-1" />
                          <div>
                            <p className="font-semibold">{product.product_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {product.category} | Section: {product.section} | Part: {product.part}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Deleted: {format(new Date(product.deleted_at), "PPP 'at' pp")}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">₹{Number(product.price).toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">Qty: {product.quantity}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">No deleted products</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </div>
  );
};

export default Reports;