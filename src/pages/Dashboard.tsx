import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingUp, AlertCircle, IndianRupee } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const Dashboard = () => {
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const totalProducts = products.length;
  const totalValue = products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
  const lowStock = products.filter(product => product.quantity < 5).length;
  const warrantyProducts = products.filter(product => product.warranty_available).length;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-6 px-4 shadow-lg">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold text-center">Smart Stock & Billing</h1>
          <p className="text-sm text-center mt-1 text-primary-foreground/90">
            Mobile Accessories & Repair Manager
          </p>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-4">
          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package className="w-4 h-4" />
                Total Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalProducts}</div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <IndianRupee className="w-4 h-4" />
                Total Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">₹{totalValue.toLocaleString('en-IN')}</div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Low Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{lowStock}</div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                With Warranty
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{warrantyProducts}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Products */}
        <Card className="mt-6 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Recent Products</CardTitle>
          </CardHeader>
          <CardContent>
            {products.slice(0, 5).length > 0 ? (
              <div className="space-y-3">
                {products.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.product_name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{product.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        ₹{product.price} • Qty: {product.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No products yet. Add your first product!
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default Dashboard;