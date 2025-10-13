import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, AlertCircle } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const Inventory = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("product_name", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const filteredProducts = products.filter((product) =>
    product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.section?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-4 px-4 shadow-lg sticky top-0 z-40">
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold mb-3">Inventory</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-foreground/60" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="pl-10 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60"
            />
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? "No products found" : "No products yet. Add your first product!"}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.product_name}
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-1 truncate">
                        {product.product_name}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-primary">
                          ₹{product.price.toLocaleString('en-IN')}
                        </span>
                        <Badge
                          variant={product.quantity < 5 ? "destructive" : "default"}
                          className={product.quantity < 5 ? "bg-destructive" : "bg-accent"}
                        >
                          Qty: {product.quantity}
                        </Badge>
                      </div>
                      
                      {(product.section || product.part || product.row_number || product.column_number) && (
                        <div className="flex items-start gap-2 text-sm text-muted-foreground mb-2">
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span className="truncate">
                            {[product.section && `Sec ${product.section}`, 
                              product.part && `Part ${product.part}`,
                              product.row_number && `Row ${product.row_number}`,
                              product.column_number && `Col ${product.column_number}`
                            ].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 flex-wrap">
                        {product.warranty_available && (
                          <Badge variant="outline" className="text-xs">
                            ✓ Warranty: {product.warranty_period}
                          </Badge>
                        )}
                        {product.quantity < 5 && (
                          <Badge variant="destructive" className="text-xs flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Low Stock
                          </Badge>
                        )}
                      </div>

                      {product.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Inventory;