import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Package, DollarSign, AlertCircle, Wrench, 
  Receipt, CheckCircle, Clock, TrendingUp, Calendar,
  FileText 
} from "lucide-react";
import { Link } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const Dashboard = () => {
  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
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
  });

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
  });

  // Today's calculations
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todaysBills = bills?.filter(b => {
    const billDate = new Date(b.created_at);
    billDate.setHours(0, 0, 0, 0);
    return billDate.getTime() === today.getTime();
  }) || [];

  const todaysTotalSales = todaysBills.reduce((sum, b) => sum + Number(b.total_amount), 0);
  
  // Monthly calculations
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyBills = bills?.filter(b => {
    const billDate = new Date(b.created_at);
    return billDate.getMonth() === currentMonth && billDate.getFullYear() === currentYear;
  }) || [];
  const monthlyRevenue = monthlyBills.reduce((sum, b) => sum + Number(b.total_amount), 0);

  // Product stats
  const totalProducts = products?.length || 0;
  
  // Repair stats
  const activeRepairs = repairs?.filter(r => 
    r.repair_status === "Received" || r.repair_status === "In Progress"
  ).length || 0;
  
  const completedRepairs = repairs?.filter(r => 
    r.repair_status === "Completed" || r.repair_status === "Delivered"
  ).length || 0;

  // Pending payments
  const pendingPayments = bills?.filter(b => Number(b.balance_amount) > 0).length || 0;

  // Upcoming deliveries (repairs with delivery date in next 7 days)
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const upcomingDeliveries = repairs?.filter(r => {
    if (!r.delivery_date) return false;
    const deliveryDate = new Date(r.delivery_date);
    return deliveryDate >= today && deliveryDate <= nextWeek;
  }).length || 0;

  const reportCards = [
    {
      title: "Today's Total Bills",
      value: todaysBills.length,
      icon: Receipt,
      subtitle: "Bills generated today",
      gradient: "from-blue-500/10 to-blue-500/5",
      iconColor: "text-blue-600"
    },
    {
      title: "Total Sales Today",
      value: `₹${todaysTotalSales.toFixed(2)}`,
      icon: DollarSign,
      subtitle: "Revenue today",
      gradient: "from-green-500/10 to-green-500/5",
      iconColor: "text-green-600"
    },
    {
      title: "Total Products",
      value: totalProducts,
      icon: Package,
      subtitle: "In inventory",
      gradient: "from-purple-500/10 to-purple-500/5",
      iconColor: "text-purple-600"
    },
    {
      title: "Active Repairs",
      value: activeRepairs,
      icon: Wrench,
      subtitle: "In progress",
      gradient: "from-orange-500/10 to-orange-500/5",
      iconColor: "text-orange-600"
    },
    {
      title: "Completed Repairs",
      value: completedRepairs,
      icon: CheckCircle,
      subtitle: "All time",
      gradient: "from-teal-500/10 to-teal-500/5",
      iconColor: "text-teal-600"
    },
    {
      title: "Pending Payments",
      value: pendingPayments,
      icon: Clock,
      subtitle: "Bills with balance",
      gradient: "from-red-500/10 to-red-500/5",
      iconColor: "text-red-600"
    },
    {
      title: "Monthly Revenue",
      value: `₹${monthlyRevenue.toFixed(2)}`,
      icon: TrendingUp,
      subtitle: "This month",
      gradient: "from-indigo-500/10 to-indigo-500/5",
      iconColor: "text-indigo-600"
    },
    {
      title: "Upcoming Deliveries",
      value: upcomingDeliveries,
      icon: Calendar,
      subtitle: "Next 7 days",
      gradient: "from-pink-500/10 to-pink-500/5",
      iconColor: "text-pink-600"
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-4 px-4 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold">Smart Stock & Billing</h1>
          <p className="text-sm opacity-90">Mobile Accessories & Repair Manager</p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card 
                key={index} 
                className={`shadow-md hover:shadow-lg transition-all hover:scale-105 bg-gradient-to-br ${card.gradient}`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <Icon className={`h-5 w-5 ${card.iconColor}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground">{card.subtitle}</p>
                </CardContent>
              </Card>
            );
          })}

          <Link to="/reports" className="block">
            <Card className="shadow-md hover:shadow-lg transition-all hover:scale-105 cursor-pointer bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">All Reports & History</CardTitle>
                <FileText className="h-5 w-5" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">View All</div>
                <p className="text-xs opacity-90">Complete history & exports</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Recent Products</h2>
          {products && products.length > 0 ? (
            <div className="grid gap-4">
              {products.slice(0, 5).map((product) => (
                <Card key={product.id} className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{product.product_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {product.category && <span className="font-medium">{product.category} | </span>}
                          Section: {product.section} | Part: {product.part} | Row: {product.row_number} | Col: {product.column_number}
                        </p>
                        <p className="text-sm text-muted-foreground">Quantity: {product.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">₹{Number(product.price).toFixed(2)}</p>
                        {product.warranty_available && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            Warranty: {product.warranty_period}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No products yet. Add your first product!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Dashboard;