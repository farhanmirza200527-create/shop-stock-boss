import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

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

interface EditProductDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const EditProductDialog = ({
  product,
  open,
  onOpenChange,
  onSuccess,
}: EditProductDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    product_name: product.product_name || "",
    price: product.price || 0,
    section: product.section || "",
    part: product.part || "",
    row_number: product.row_number || "",
    column_number: product.column_number || "",
    warranty_available: product.warranty_available ? "Yes" : "No",
    warranty_period: product.warranty_period || "",
    quantity: product.quantity || 0,
    description: product.description || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("products")
        .update({
          ...formData,
          warranty_available: formData.warranty_available === "Yes",
        })
        .eq("id", product.id);

      if (error) throw error;

      toast.success("✅ Product Updated Successfully!");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit_product_name">Product Name *</Label>
            <Input
              id="edit_product_name"
              value={formData.product_name}
              onChange={(e) =>
                setFormData({ ...formData, product_name: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit_price">Price (₹) *</Label>
              <Input
                id="edit_price"
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="edit_quantity">Quantity *</Label>
              <Input
                id="edit_quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })
                }
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit_section">Section</Label>
              <Input
                id="edit_section"
                value={formData.section}
                onChange={(e) =>
                  setFormData({ ...formData, section: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit_part">Part</Label>
              <Input
                id="edit_part"
                value={formData.part}
                onChange={(e) =>
                  setFormData({ ...formData, part: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit_row">Row</Label>
              <Input
                id="edit_row"
                value={formData.row_number}
                onChange={(e) =>
                  setFormData({ ...formData, row_number: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit_column">Column</Label>
              <Input
                id="edit_column"
                value={formData.column_number}
                onChange={(e) =>
                  setFormData({ ...formData, column_number: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit_warranty">Warranty Available</Label>
            <select
              id="edit_warranty"
              value={formData.warranty_available}
              onChange={(e) =>
                setFormData({ ...formData, warranty_available: e.target.value })
              }
              className="w-full p-2 border rounded-lg bg-background"
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>

          {formData.warranty_available === "Yes" && (
            <div>
              <Label htmlFor="edit_warranty_period">Warranty Period</Label>
              <Input
                id="edit_warranty_period"
                value={formData.warranty_period}
                onChange={(e) =>
                  setFormData({ ...formData, warranty_period: e.target.value })
                }
              />
            </div>
          )}

          <div>
            <Label htmlFor="edit_description">Description</Label>
            <Textarea
              id="edit_description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProductDialog;