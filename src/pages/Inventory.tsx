import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, MapPin, AlertCircle, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import EditProductDialog from "@/components/EditProductDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Product {
  id: string;
  product_name: string;
  price: number;
  section: string | null;
  part: string | null;
  row_number: string | null;
  column_number: string | null;
  warranty_available: boolean;
  warranty_period: string | null;
  quantity: number;
  description: string | null;
  image_url: string | null;
}

const Inventory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("product_name", { ascending: true });
      
      if (error) throw error;
      return data as Product[];
    },
  });

  const filteredProducts = products.filter((product) =>
    product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.section?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deletingProductId) return;

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", deletingProductId);

      if (error) throw error;

      toast.success("Product deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    } finally {
      setDeletingProductId(null);
    }
  };

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

                      <div className="flex items-center gap-2 flex-wrap mb-3">
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
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {product.description}
                        </p>
                      )}

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingProduct(product)}
                          className="flex-1"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeletingProductId(product.id)}
                          className="flex-1"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {editingProduct && (
        <EditProductDialog
          product={editingProduct}
          open={!!editingProduct}
          onOpenChange={(open) => !open && setEditingProduct(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
          }}
        />
      )}

      <AlertDialog open={!!deletingProductId} onOpenChange={(open) => !open && setDeletingProductId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
};

export default Inventory;