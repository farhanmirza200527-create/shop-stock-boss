import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Camera, Upload, ArrowLeft, Plus, ScanBarcode } from "lucide-react";
import BarcodeScanner from "@/components/BarcodeScanner";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { useGuestData } from "@/hooks/useGuestData";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Category {
  id: string;
  name: string;
  type: 'PRODUCT' | 'SERVICE';
}

const AddProduct = () => {
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();
  const { addProduct: addGuestProduct, addCategory: addGuestCategory, getCategories: getGuestCategories } = useGuestData();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState<'PRODUCT' | 'SERVICE'>('PRODUCT');
  const [guestCategories, setGuestCategories] = useState<Category[]>([]);

  // Fetch user's categories from database
  const { data: dbCategories = [], refetch: refetchCategories } = useQuery({
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

  // Load guest categories
  useEffect(() => {
    if (isGuest) {
      setGuestCategories(getGuestCategories() as Category[]);
    }
  }, [isGuest, getGuestCategories]);

  const categories = isGuest ? guestCategories : dbCategories;

  const [formData, setFormData] = useState({
    product_name: "",
    price: 0,
    section: "",
    part: "",
    row_number: "",
    column_number: "",
    category_id: "",
    category: "",
    item_type: "PRODUCT" as 'PRODUCT' | 'SERVICE',
    warranty_available: "No",
    warranty_period: "",
    quantity: 0,
    quantity_unit: "pcs",
    description: "",
    barcode: "",
  });
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  const handleBarcodeScan = (code: string) => {
    setFormData({ ...formData, barcode: code });
    toast.success(`Barcode scanned: ${code}`);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCategoryChange = (value: string) => {
    if (value === "new") {
      setShowNewCategoryDialog(true);
    } else {
      const selectedCategory = categories.find(c => c.id === value);
      if (selectedCategory) {
        setFormData({ 
          ...formData, 
          category_id: value,
          category: selectedCategory.name,
          item_type: selectedCategory.type,
        });
      }
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    try {
      if (isGuest) {
        // Guest mode - store locally
        const newCategory = addGuestCategory({
          name: newCategoryName.trim(),
          type: newCategoryType,
        });
        setGuestCategories(getGuestCategories() as Category[]);
        setFormData({
          ...formData,
          category_id: newCategory.id,
          category: newCategory.name,
          item_type: newCategory.type,
        });
      } else {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        const currentUserId = session?.user?.id;

        if (!currentUserId) {
          toast.error("You must be logged in. Please login again.");
          navigate("/auth");
          return;
        }

        const { data: newCategory, error } = await supabase
          .from("categories")
          .insert({
            name: newCategoryName.trim(),
            type: newCategoryType,
            user_id: currentUserId,
          })
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            toast.error("A category with this name already exists");
          } else {
            throw error;
          }
          return;
        }

        await refetchCategories();
        setFormData({
          ...formData,
          category_id: newCategory.id,
          category: newCategory.name,
          item_type: newCategory.type as 'PRODUCT' | 'SERVICE',
        });
      }

      toast.success(`Category "${newCategoryName}" created!`);
      setShowNewCategoryDialog(false);
      setNewCategoryName("");
      setNewCategoryType("PRODUCT");
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error("Failed to create category");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      if (isGuest) {
        // Guest mode - store locally
        addGuestProduct({
          ...formData,
          warranty_available: formData.warranty_available === "Yes",
          image_url: imagePreview || undefined,
          barcode: formData.barcode || undefined,
        });
        toast.success("✅ Product Added Successfully!");
      } else {
        // CRITICAL: Re-fetch current session to ensure we have the latest user
        const { data: { session } } = await supabase.auth.getSession();
        const currentUserId = session?.user?.id;

        // Block save if user is not authenticated
        if (!currentUserId) {
          toast.error("You must be logged in to add products. Please login again.");
          navigate("/auth");
          return;
        }

        let imageUrl = "";

        // Upload image if selected
        if (imageFile) {
          const fileExt = imageFile.name.split(".").pop();
          const fileName = `${currentUserId}/${Math.random()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from("product-images")
            .upload(fileName, imageFile);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from("product-images")
            .getPublicUrl(fileName);

          imageUrl = publicUrl;
        }

        // Insert product data with verified user_id
        const { error: insertError } = await supabase.from("products").insert({
          product_name: formData.product_name,
          price: formData.price,
          section: formData.section || null,
          part: formData.part || null,
          row_number: formData.row_number || null,
          column_number: formData.column_number || null,
          category: formData.category || null,
          category_id: formData.category_id || null,
          item_type: formData.item_type,
          warranty_available: formData.warranty_available === "Yes",
          warranty_period: formData.warranty_period || null,
          quantity: formData.item_type === 'SERVICE' ? 0 : formData.quantity,
          description: formData.description || null,
          image_url: imageUrl,
          user_id: currentUserId,
          barcode: formData.barcode || null,
        });

        if (insertError) throw insertError;

        toast.success("✅ Product Added Successfully!");
        queryClient.invalidateQueries({ queryKey: ["products"] });
      }
      
      // Reset form
      setFormData({
        product_name: "",
        price: 0,
        section: "",
        part: "",
        row_number: "",
        column_number: "",
        category_id: "",
        category: "",
        item_type: "PRODUCT",
        warranty_available: "No",
        warranty_period: "",
        quantity: 0,
        description: "",
        barcode: "",
      });
      setImageFile(null);
      setImagePreview("");

      // Navigate to inventory
      setTimeout(() => navigate("/inventory"), 1000);
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Failed to add product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-4 px-4 shadow-lg sticky top-0 z-40">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Add New Product</h1>
          {isGuest && (
            <span className="ml-auto text-xs bg-primary-foreground/20 px-2 py-1 rounded">
              Guest Mode
            </span>
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Product Photo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {imagePreview && (
                <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <Label htmlFor="camera-upload" className="flex-1">
                  <div className="flex items-center justify-center gap-2 p-3 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:bg-primary/90 transition-colors">
                    <Camera className="w-5 h-5" />
                    <span>Camera</span>
                  </div>
                  <Input
                    id="camera-upload"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </Label>
                <Label htmlFor="file-upload" className="flex-1">
                  <div className="flex items-center justify-center gap-2 p-3 bg-secondary text-secondary-foreground rounded-lg cursor-pointer hover:bg-secondary/80 transition-colors">
                    <Upload className="w-5 h-5" />
                    <span>Upload</span>
                  </div>
                  <Input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Category Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="category">Select Category *</Label>
                <Select 
                  value={formData.category_id} 
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue placeholder="Select a category..." />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name} ({cat.type === 'SERVICE' ? 'Service' : 'Product'})
                      </SelectItem>
                    ))}
                    <SelectItem value="new" className="text-primary font-medium">
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add New Category
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.category && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium">Category:</span> {formData.category}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Type:</span> {formData.item_type === 'SERVICE' ? 'Service' : 'Product'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {formData.item_type === 'SERVICE' ? 'Service' : 'Product'} Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="product_name">Name *</Label>
                <Input
                  id="product_name"
                  value={formData.product_name}
                  onChange={(e) =>
                    setFormData({ ...formData, product_name: e.target.value })
                  }
                  placeholder={formData.item_type === 'SERVICE' ? "e.g., Screen Repair" : "e.g., iPhone 15 Cover"}
                  required
                />
              </div>

              <div>
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0"
                  required
                />
              </div>

              {formData.item_type === 'PRODUCT' && (
                <div>
                  <Label htmlFor="quantity">Quantity in Stock</Label>
                  <div className="flex gap-0">
                    <Input
                      id="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="0"
                      className="rounded-r-none border-r-0 flex-1"
                    />
                    <Select
                      value={formData.quantity_unit}
                      onValueChange={(value) => setFormData({ ...formData, quantity_unit: value })}
                    >
                      <SelectTrigger className="w-[90px] rounded-l-none bg-muted/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        <SelectItem value="pcs">Pcs</SelectItem>
                        <SelectItem value="kg">Kg</SelectItem>
                        <SelectItem value="g">Gram</SelectItem>
                        <SelectItem value="l">Litre</SelectItem>
                        <SelectItem value="ml">mL</SelectItem>
                        <SelectItem value="m">Meter</SelectItem>
                        <SelectItem value="ft">Feet</SelectItem>
                        <SelectItem value="box">Box</SelectItem>
                        <SelectItem value="dozen">Dozen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Barcode field */}
              <div>
                <Label htmlFor="barcode">Barcode / SKU (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) =>
                      setFormData({ ...formData, barcode: e.target.value })
                    }
                    placeholder="Scan or enter barcode..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowBarcodeScanner(true)}
                    className="shrink-0"
                  >
                    <ScanBarcode className="w-5 h-5" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Use barcode to quickly add products to bills
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Location in Shop (only for products) */}
          {formData.item_type === 'PRODUCT' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Location in Shop</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="section">Section</Label>
                  <Input
                    id="section"
                    value={formData.section}
                    onChange={(e) =>
                      setFormData({ ...formData, section: e.target.value })
                    }
                    placeholder="e.g., A"
                  />
                </div>
                <div>
                  <Label htmlFor="part">Part</Label>
                  <Input
                    id="part"
                    value={formData.part}
                    onChange={(e) =>
                      setFormData({ ...formData, part: e.target.value })
                    }
                    placeholder="e.g., 2"
                  />
                </div>
                <div>
                  <Label htmlFor="row_number">Row</Label>
                  <Input
                    id="row_number"
                    value={formData.row_number}
                    onChange={(e) =>
                      setFormData({ ...formData, row_number: e.target.value })
                    }
                    placeholder="e.g., 3"
                  />
                </div>
                <div>
                  <Label htmlFor="column_number">Column</Label>
                  <Input
                    id="column_number"
                    value={formData.column_number}
                    onChange={(e) =>
                      setFormData({ ...formData, column_number: e.target.value })
                    }
                    placeholder="e.g., 5"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Warranty */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Warranty Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="warranty_available">Warranty Available</Label>
                <select
                  id="warranty_available"
                  value={formData.warranty_available}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      warranty_available: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded-lg bg-background"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              {formData.warranty_available === "Yes" && (
                <div>
                  <Label htmlFor="warranty_period">Warranty Period</Label>
                  <Input
                    id="warranty_period"
                    value={formData.warranty_period}
                    onChange={(e) =>
                      setFormData({ ...formData, warranty_period: e.target.value })
                    }
                    placeholder="e.g., 6 months, 1 year"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Any special remarks..."
                rows={4}
              />
            </CardContent>
          </Card>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-accent-foreground font-semibold py-6"
          >
            {loading ? "Adding..." : `Add ${formData.item_type === 'SERVICE' ? 'Service' : 'Product'}`}
          </Button>
        </form>
      </div>

      {/* New Category Dialog */}
      <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="new-category-name">Category Name</Label>
              <Input
                id="new-category-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g., Mobile Repair, Hair Cutting, Cold Drinks"
              />
            </div>
            <div>
              <Label htmlFor="new-category-type">Type</Label>
              <Select 
                value={newCategoryType} 
                onValueChange={(v) => setNewCategoryType(v as 'PRODUCT' | 'SERVICE')}
              >
                <SelectTrigger className="w-full bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  <SelectItem value="PRODUCT">Product (has quantity/stock)</SelectItem>
                  <SelectItem value="SERVICE">Service (no quantity needed)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCategoryDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCategory}>
              Create Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Barcode Scanner */}
      <BarcodeScanner
        open={showBarcodeScanner}
        onOpenChange={setShowBarcodeScanner}
        onScan={handleBarcodeScan}
        title="Scan Product Barcode"
      />

      <BottomNav />
    </div>
  );
};

export default AddProduct;