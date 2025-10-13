import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Camera, Upload, ArrowLeft } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const AddProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  
  const [formData, setFormData] = useState({
    product_name: "",
    price: 0,
    section: "",
    part: "",
    row_number: "",
    column_number: "",
    warranty_available: "No",
    warranty_period: "",
    quantity: 0,
    description: "",
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = "";

      // Upload image if selected
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError, data } = await supabase.storage
          .from("product-images")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      // Insert product data
      const { error: insertError } = await supabase.from("products").insert({
        ...formData,
        warranty_available: formData.warranty_available === "Yes",
        image_url: imageUrl,
      });

      if (insertError) throw insertError;

      toast.success("✅ Product Added Successfully!");
      
      // Reset form
      setFormData({
        product_name: "",
        price: 0,
        section: "",
        part: "",
        row_number: "",
        column_number: "",
        warranty_available: "No",
        warranty_period: "",
        quantity: 0,
        description: "",
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

          {/* Product Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Product Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="product_name">Product Name *</Label>
                <Input
                  id="product_name"
                  value={formData.product_name}
                  onChange={(e) =>
                    setFormData({ ...formData, product_name: e.target.value })
                  }
                  placeholder="e.g., iPhone 15 Cover"
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

              <div>
                <Label htmlFor="quantity">Quantity in Stock *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })
                  }
                  placeholder="0"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Location in Shop */}
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
                placeholder="Any special remarks or product type..."
                rows={4}
              />
            </CardContent>
          </Card>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-accent-foreground font-semibold py-6"
          >
            {loading ? "Adding Product..." : "Add Product"}
          </Button>
        </form>
      </div>

      <BottomNav />
    </div>
  );
};

export default AddProduct;