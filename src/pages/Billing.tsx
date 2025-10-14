import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Trash2, Receipt, IndianRupee } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Product {
  id: string;
  product_name: string;
  price: number;
  quantity: number;
}

interface BillItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
}

const Billing = () => {
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, product_name, price, quantity")
        .order("product_name", { ascending: true });
      
      if (error) throw error;
      return data as Product[];
    },
  });

  const filteredProducts = products.filter((product) =>
    product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    product.quantity > 0
  );

  const addProductToBill = (product: Product) => {
    const existingItem = billItems.find(item => item.productId === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.quantity) {
        toast.error("Cannot add more than available stock");
        return;
      }
      setBillItems(billItems.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      setBillItems([...billItems, {
        productId: product.id,
        productName: product.product_name,
        price: product.price,
        quantity: 1,
        subtotal: product.price,
      }]);
    }
    toast.success(`${product.product_name} added to bill`);
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (newQuantity > product.quantity) {
      toast.error("Cannot exceed available stock");
      return;
    }

    if (newQuantity <= 0) {
      removeItem(productId);
      return;
    }

    setBillItems(billItems.map(item =>
      item.productId === productId
        ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.price }
        : item
    ));
  };

  const removeItem = (productId: string) => {
    setBillItems(billItems.filter(item => item.productId !== productId));
  };

  const totalAmount = billItems.reduce((sum, item) => sum + item.subtotal, 0);
  const balanceAmount = paidAmount - totalAmount;

  const handleSaveBill = async () => {
    if (billItems.length === 0) {
      toast.error("Please add items to the bill");
      return;
    }

    if (paidAmount < totalAmount) {
      toast.error("Paid amount cannot be less than total amount");
      return;
    }

    setLoading(true);

    try {
      // Save bill to database
      const { error: billError } = await supabase.from("bills").insert([{
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        balance_amount: balanceAmount,
        bill_items: billItems as any,
      }]);

      if (billError) throw billError;

      // Update product quantities
      for (const item of billItems) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const { error: updateError } = await supabase
            .from("products")
            .update({ quantity: product.quantity - item.quantity })
            .eq("id", item.productId);

          if (updateError) throw updateError;
        }
      }

      toast.success("✅ Bill saved successfully!");
      
      // Reset form
      setBillItems([]);
      setPaidAmount(0);
      setCustomerName("");
      setCustomerPhone("");
      
      // Refresh products
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (error) {
      console.error("Error saving bill:", error);
      toast.error("Failed to save bill");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-4 px-4 shadow-lg sticky top-0 z-40">
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold">Create Bill</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Customer Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer Details (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="customer_name">Customer Name</Label>
              <Input
                id="customer_name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
              />
            </div>
            <div>
              <Label htmlFor="customer_phone">Phone Number</Label>
              <Input
                id="customer_phone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
          </CardContent>
        </Card>

        {/* Add Products */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Bill Items</CardTitle>
              <Button
                size="sm"
                onClick={() => setShowProductDialog(true)}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Product
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {billItems.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No items added. Click "Add Product" to start.
              </p>
            ) : (
              <div className="space-y-3">
                {billItems.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        ₹{item.price} × {item.quantity} = ₹{item.subtotal.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      >
                        +
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeItem(item.productId)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bill Summary */}
        <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="pt-6 space-y-4">
            <div className="flex justify-between items-center text-lg">
              <span className="font-semibold">Total Amount:</span>
              <span className="font-bold text-primary text-xl">
                ₹{totalAmount.toLocaleString('en-IN')}
              </span>
            </div>

            <div>
              <Label htmlFor="paid_amount">Amount Paid (₹)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="paid_amount"
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="pl-10 text-lg font-semibold"
                />
              </div>
            </div>

            {paidAmount > 0 && (
              <div className="flex justify-between items-center text-lg pt-2 border-t">
                <span className="font-semibold">Balance to Return:</span>
                <Badge
                  variant={balanceAmount >= 0 ? "default" : "destructive"}
                  className={`text-lg px-4 py-2 ${balanceAmount >= 0 ? "bg-accent" : ""}`}
                >
                  ₹{balanceAmount.toLocaleString('en-IN')}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          onClick={handleSaveBill}
          disabled={loading || billItems.length === 0}
          className="w-full bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-accent-foreground font-semibold py-6"
        >
          <Receipt className="w-5 h-5 mr-2" />
          {loading ? "Saving Bill..." : "Save Bill"}
        </Button>
      </div>

      {/* Product Selection Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Product</DialogTitle>
          </DialogHeader>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="pl-10"
            />
          </div>
          <div className="flex-1 overflow-y-auto space-y-2">
            {filteredProducts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No products available
              </p>
            ) : (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => {
                    addProductToBill(product);
                    setShowProductDialog(false);
                    setSearchQuery("");
                  }}
                  className="flex justify-between items-center p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                >
                  <div>
                    <p className="font-medium">{product.product_name}</p>
                    <p className="text-sm text-muted-foreground">
                      ₹{product.price} • Stock: {product.quantity}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default Billing;