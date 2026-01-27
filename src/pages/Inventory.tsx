import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, MapPin, AlertCircle, Edit, Trash2, Mic, ScanBarcode, Plus, Wrench, Package } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import EditProductDialog from "@/components/EditProductDialog";
import BarcodeScanner from "@/components/BarcodeScanner";
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
import { useAuth } from "@/hooks/useAuth";
import { useGuestData } from "@/hooks/useGuestData";

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
  category_id: string | null;
  item_type: string | null;
  deleted_at: string | null;
  barcode: string | null;
}

interface Category {
  id: string;
  name: string;
  type: string;
}

const Inventory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [guestProducts, setGuestProducts] = useState<Product[]>([]);
  const [guestCategories, setGuestCategories] = useState<Category[]>([]);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();
  const { getProducts: getGuestProducts, getCategories: getGuestCategories, deleteProduct: deleteGuestProduct } = useGuestData();

  // Fetch user's categories from database
  const { data: dbCategories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, type")
        .order("name", { ascending: true });
      
      if (error) throw error;
      return data as Category[];
    },
    enabled: !isGuest && !!user,
  });

  // Fetch products
  const { data: dbProducts = [], isLoading } = useQuery({
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
    enabled: !isGuest && !!user,
  });

  // Load guest data
  useEffect(() => {
    if (isGuest) {
      const products = getGuestProducts();
      setGuestProducts(products.map(p => ({
        ...p,
        section: p.section || null,
        part: p.part || null,
        row_number: p.row_number || null,
        column_number: p.column_number || null,
        warranty_period: p.warranty_period || null,
        description: p.description || null,
        image_url: p.image_url || null,
        category: p.category || null,
        category_id: p.category_id || null,
        item_type: p.item_type || 'PRODUCT',
        deleted_at: p.deleted_at || null,
        barcode: p.barcode || null,
      })));
      setGuestCategories(getGuestCategories() as Category[]);
    }
  }, [isGuest, getGuestProducts, getGuestCategories]);

  const products = isGuest ? guestProducts : dbProducts;
  const categories = isGuest ? guestCategories : dbCategories;

  // Handle barcode scan - find and focus product
  const handleBarcodeScan = (code: string) => {
    const product = products.find(p => 
      p.barcode?.toLowerCase() === code.toLowerCase() ||
      p.product_name.toLowerCase() === code.toLowerCase()
    );
    
    if (product) {
      setSearchQuery(product.product_name);
      toast.success(`Found: ${product.product_name}`);
    } else {
      toast.error(`No product found with barcode: ${code}`);
    }
  };

  // Get unique category names for filter tabs
  const categoryNames = ["All", ...new Set(categories.map(c => c.name))];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.section?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group products by category
  const groupedProducts = filteredProducts.reduce((acc, product) => {
    const categoryName = product.category || "Uncategorized";
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  const handleDelete = async () => {
    if (!deletingProductId) return;

    try {
      if (isGuest) {
        deleteGuestProduct(deletingProductId);
        const updatedProducts = getGuestProducts();
        setGuestProducts(updatedProducts.map(p => ({
          ...p,
          section: p.section || null,
          part: p.part || null,
          row_number: p.row_number || null,
          column_number: p.column_number || null,
          warranty_period: p.warranty_period || null,
          description: p.description || null,
          image_url: p.image_url || null,
          category: p.category || null,
          category_id: p.category_id || null,
          item_type: p.item_type || 'PRODUCT',
          deleted_at: p.deleted_at || null,
          barcode: p.barcode || null,
        })));
      } else {
        const { error } = await supabase
          .from("products")
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", deletingProductId);

        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: ["deleted-products"] });
      }

      toast.success("Item moved to deleted list");
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item");
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
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold">Inventory</h1>
            {isGuest && (
              <span className="text-xs bg-primary-foreground/20 px-2 py-1 rounded">
                Guest Mode
              </span>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-foreground/60" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products & services..."
              className="pl-10 pr-20 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
              <Button size="icon" variant="ghost" className="h-8 w-8 text-primary-foreground">
                <Mic className="w-4 h-4" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8 text-primary-foreground"
                onClick={() => setShowBarcodeScanner(true)}
              >
                <ScanBarcode className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Horizontal Scrolling Categories */}
        {categoryNames.length > 1 && (
          <ScrollArea className="w-full whitespace-nowrap mb-6">
            <div className="flex gap-2 pb-2">
              {categoryNames.map((category) => (
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
        )}

        {/* Empty State */}
        {!isLoading && products.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No items yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by creating a category and adding your products or services
            </p>
            <Button onClick={() => navigate("/add-product")}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Item
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading inventory...
          </div>
        ) : selectedCategory === "All" ? (
          // Grouped view when "All" is selected
          Object.entries(groupedProducts).map(([categoryName, categoryProducts]) => (
            <div key={categoryName} className="mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                {categoryProducts[0]?.item_type === 'SERVICE' ? (
                  <Wrench className="w-5 h-5 text-primary" />
                ) : (
                  <Package className="w-5 h-5 text-primary" />
                )}
                {categoryName}
                <Badge variant="secondary" className="ml-2">
                  {categoryProducts.length}
                </Badge>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onEdit={() => setEditingProduct(product)}
                    onDelete={() => setDeletingProductId(product.id)}
                    onAddToBilling={() => handleAddToBilling(product)}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          // Flat view when specific category is selected
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={() => setEditingProduct(product)}
                onDelete={() => setDeletingProductId(product.id)}
                onAddToBilling={() => handleAddToBilling(product)}
              />
            ))}
          </div>
        )}

        {!isLoading && products.length > 0 && filteredProducts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No items found matching your search
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
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              This item will be moved to the deleted list. You can view it in Reports & History.
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

      {/* Barcode Scanner */}
      <BarcodeScanner
        open={showBarcodeScanner}
        onOpenChange={setShowBarcodeScanner}
        onScan={handleBarcodeScan}
        title="Scan to Find Product"
      />

      <BottomNav />
    </div>
  );
};

// Product Card Component
const ProductCard = ({ 
  product, 
  onEdit, 
  onDelete, 
  onAddToBilling 
}: { 
  product: Product; 
  onEdit: () => void; 
  onDelete: () => void;
  onAddToBilling: () => void;
}) => {
  const isService = product.item_type === 'SERVICE';

  return (
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
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
              <div className="flex items-center gap-2">
                {isService ? (
                  <Wrench className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Package className="w-4 h-4 text-muted-foreground" />
                )}
                <h3 className="font-semibold text-lg">{product.product_name}</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                {product.category} • {isService ? 'Service' : 'Product'}
              </p>
              <p className="text-2xl font-bold text-primary mt-1">₹{Number(product.price).toFixed(2)}</p>
            </div>
            <Button
              size="icon"
              className="rounded-full bg-gradient-to-br from-primary to-primary/80 hover:scale-110 transition-transform"
              onClick={onAddToBilling}
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          {!isService && product.section && (
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
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {!isService && (
              <Badge
                variant={product.quantity < 5 ? "destructive" : "default"}
              >
                Qty: {product.quantity}
              </Badge>
            )}
            {isService && (
              <Badge variant="secondary">Service</Badge>
            )}
            {product.warranty_available && (
              <Badge variant="outline" className="text-xs">
                ✓ {product.warranty_period}
              </Badge>
            )}
            {!isService && product.quantity < 5 && (
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
              onClick={onEdit}
              className="flex-1"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={onDelete}
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Inventory;