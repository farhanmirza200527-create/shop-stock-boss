import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, MapPin, AlertCircle, Edit, Trash2, Mic, Camera, Plus } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import EditProductDialog from "@/components/EditProductDialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
  category: string | null;
  deleted_at: string | null;
}

const Inventory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const categories = ["All", "Cables", "Covers", "Chargers", "Earbuds", "Screen Guards", "Other"];

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .is("deleted_at", null)
        .order("product_name", { ascending: true });
      
      if (error) throw error;
      return data as Product[];
    },
  });

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.section?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = async () => {
    if (!deletingProductId) return;

    try {
      const { error } = await supabase
        .from("products")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", deletingProductId);

      if (error) throw error;

      toast.success("Product moved to deleted list");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["deleted-products"] });
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    } finally {
      setDeletingProductId(null);
    }
  };

  const handleAddToBilling = (product: Product) => {
    sessionStorage.setItem('quickAddProduct', JSON.stringify(product));
    navigate('/billing');
    toast.success(`${product.product_name} added to billing page`);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-4 px-4 shadow-lg sticky top-0 z-40">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-xl font-bold mb-3">Inventory</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-foreground/60" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="pl-10 pr-20 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
              <Button size="icon" variant="ghost" className="h-8 w-8 text-primary-foreground">
                <Mic className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-primary-foreground">
                <Camera className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Horizontal Scrolling Categories */}
        <ScrollArea className="w-full whitespace-nowrap mb-6">
          <div className="flex gap-2 pb-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="rounded-full"
              >
                {category}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? "No products found" : "No products yet. Add your first product!"}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.product_name}
                      className="w-full h-40 object-cover rounded-lg mb-4"
                    />
                  )}
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{product.product_name}</h3>
                        <p className="text-xs text-muted-foreground">{product.category}</p>
                        <p className="text-2xl font-bold text-primary mt-1">₹{Number(product.price).toFixed(2)}</p>
                      </div>
                      <Button
                        size="icon"
                        className="rounded-full bg-gradient-to-br from-primary to-primary/80 hover:scale-110 transition-transform"
                        onClick={() => handleAddToBilling(product)}
                      >
                        <Plus className="w-5 h-5" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">
                        {[product.section && `Sec ${product.section}`, 
                          product.part && `Part ${product.part}`,
                          product.row_number && `Row ${product.row_number}`,
                          product.column_number && `Col ${product.column_number}`
                        ].filter(Boolean).join(', ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={product.quantity < 5 ? "destructive" : "default"}
                      >
                        Qty: {product.quantity}
                      </Badge>
                      {product.warranty_available && (
                        <Badge variant="outline" className="text-xs">
                          ✓ {product.warranty_period}
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
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    <div className="flex gap-2 pt-2">
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
              This product will be moved to the deleted list. You can view it in Reports & History.
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