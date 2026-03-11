import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  Trash2, 
  Receipt, 
  IndianRupee, 
  FileText,
  CreditCard,
  Banknote,
  Smartphone,
  Percent,
  History,
  MessageCircle,
  MessageSquare,
  Share2,
  X,
  ScanBarcode,
  QrCode
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useGuestData } from "@/hooks/useGuestData";
import BillHistoryDialog, { Bill } from "@/components/billing/BillHistoryDialog";
import RefundDialog, { RefundData } from "@/components/billing/RefundDialog";
import ReceivePaymentDialog from "@/components/billing/ReceivePaymentDialog";
import { downloadBillPdf, shareViaWhatsApp, shareViaSMS, shareBillPdf, BillData } from "@/components/billing/BillPdfGenerator";
import BarcodeScanner from "@/components/BarcodeScanner";

interface Product {
  id: string;
  product_name: string;
  price: number;
  quantity: number;
  item_type?: string;
  category?: string;
  barcode?: string;
}

interface BillItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
  itemType?: string;
  categoryName?: string;
}

type PaymentMode = "CASH" | "ONLINE" | "CARD";
type BillStatus = "PAID" | "UNPAID" | "PARTIAL";

const Billing = () => {
  const { user, isGuest } = useAuth();
  const { 
    getProducts: getGuestProducts, 
    updateProduct: updateGuestProduct, 
    addBill: addGuestBill,
    getBills: getGuestBills,
    updateBill: updateGuestBill,
  } = useGuestData();
  
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("CASH");
  const [discount, setDiscount] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestProducts, setGuestProducts] = useState<Product[]>([]);
  
  // Refund/Return states
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refundMode, setRefundMode] = useState<"refund" | "return" | "cancel">("refund");
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [receivePaymentDialogOpen, setReceivePaymentDialogOpen] = useState(false);
  const [refundLoading, setRefundLoading] = useState(false);
  
  // Share dialog state
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [lastBillData, setLastBillData] = useState<BillData | null>(null);
  
  // Barcode scanner state
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  
  // Payment QR code dialog state
  const [showPaymentQR, setShowPaymentQR] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch products for authenticated users
  const { data: dbProducts = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, product_name, price, quantity, item_type, category, barcode")
        .is("deleted_at", null)
        .order("product_name", { ascending: true });
      
      if (error) throw error;
      return data as Product[];
    },
    enabled: !isGuest,
  });

  // Fetch bills for authenticated users
  const { data: dbBills = [], refetch: refetchBills } = useQuery({
    queryKey: ["bills"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bills")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Bill[];
    },
    enabled: !isGuest,
  });

  // Fetch payment QR codes
  const { data: paymentQRCodes = [] } = useQuery({
    queryKey: ["payment-qr-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_qr_codes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !isGuest,
  });

  // Guest QR codes
  const guestQRCodes = isGuest ? (() => {
    try { return JSON.parse(localStorage.getItem("guestPaymentQRs") || "[]"); }
    catch { return []; }
  })() : [];

  const allQRCodes = isGuest ? guestQRCodes : paymentQRCodes;

  // Update guest products when needed
  useEffect(() => {
    if (isGuest) {
      const guestData = getGuestProducts();
      setGuestProducts(guestData.map(p => ({
        id: p.id,
        product_name: p.product_name,
        price: p.price,
        quantity: p.quantity,
        item_type: p.item_type,
        category: p.category,
        barcode: p.barcode,
      })));
    }
  }, [isGuest, getGuestProducts]);

  const products = isGuest ? guestProducts : dbProducts;
  const bills = isGuest ? (getGuestBills() as unknown as Bill[]) : dbBills;

  // Filter products - show all for services (no stock check)
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.product_name.toLowerCase().includes(searchQuery.toLowerCase());
    const isService = product.item_type === "SERVICE";
    return matchesSearch && (isService || product.quantity > 0);
  });

  const addProductToBill = (product: Product) => {
    const existingItem = billItems.find(item => item.productId === product.id);
    const isService = product.item_type === "SERVICE";
    
    if (existingItem) {
      // For products, check stock
      if (!isService && existingItem.quantity >= product.quantity) {
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
        itemType: product.item_type || "PRODUCT",
        categoryName: product.category,
      }]);
    }
    toast.success(`${product.product_name} added to bill`);
  };

  // Handle barcode scan - find product by barcode and add to bill
  const handleBarcodeScan = (code: string) => {
    const product = products.find(p => 
      p.barcode?.toLowerCase() === code.toLowerCase() ||
      p.product_name.toLowerCase() === code.toLowerCase()
    );
    
    if (product) {
      addProductToBill(product);
    } else {
      toast.error(`No product found with barcode: ${code}`);
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    const product = products.find(p => p.id === productId);
    const billItem = billItems.find(b => b.productId === productId);
    if (!product || !billItem) return;

    const isService = billItem.itemType === "SERVICE";

    // For products, check stock
    if (!isService && newQuantity > product.quantity) {
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

  const subTotal = billItems.reduce((sum, item) => sum + item.subtotal, 0);
  const grandTotal = subTotal - discount + tax;
  
  // Calculate return amount and bill status
  const calculateBillStatus = (): { status: BillStatus; returnAmount: number } => {
    if (paidAmount >= grandTotal) {
      return { status: "PAID", returnAmount: paidAmount - grandTotal };
    } else if (paidAmount > 0) {
      return { status: "PARTIAL", returnAmount: 0 };
    }
    return { status: "UNPAID", returnAmount: 0 };
  };

  const { status: billStatus, returnAmount } = calculateBillStatus();

  // Validate payment mode
  const validatePayment = (): boolean => {
    if (paymentMode !== "CASH") {
      if (paidAmount !== grandTotal && paidAmount > 0) {
        toast.error(`For ${paymentMode} payment, amount must equal total or be zero (unpaid)`);
        return false;
      }
    }
    return true;
  };

  const handleSaveBill = async () => {
    if (billItems.length === 0) {
      toast.error("Please add items to the bill");
      return;
    }

    if (!validatePayment()) {
      return;
    }

    setLoading(true);

    try {
      const billData = {
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        total_amount: subTotal,
        paid_amount: paidAmount,
        balance_amount: grandTotal - paidAmount,
        return_amount: returnAmount,
        discount,
        tax,
        bill_items: billItems,
        payment_mode: paymentMode,
        bill_status: billStatus,
      };

      let savedBillNumber = "";

      if (isGuest) {
        // Guest mode - store locally
        const newBill = addGuestBill({
          ...billData,
          customer_name: customerName || undefined,
          customer_phone: customerPhone || undefined,
        });
        savedBillNumber = `BILL-${newBill.id.slice(0, 8).toUpperCase()}`;

        // Update product quantities locally (only for products, not services)
        for (const item of billItems) {
          if (item.itemType !== "SERVICE") {
            const product = guestProducts.find(p => p.id === item.productId);
            if (product) {
              updateGuestProduct(item.productId, { quantity: product.quantity - item.quantity });
            }
          }
        }

        // Refresh guest products
        const updatedProducts = getGuestProducts();
        setGuestProducts(updatedProducts.map(p => ({
          id: p.id,
          product_name: p.product_name,
          price: p.price,
          quantity: p.quantity,
          item_type: p.item_type,
          category: p.category,
        })));
      } else {
        // CRITICAL: Re-fetch current session to ensure we have the latest user
        const { data: { session } } = await supabase.auth.getSession();
        const currentUserId = session?.user?.id;

        // Block save if user is not authenticated
        if (!currentUserId) {
          toast.error("You must be logged in to save bills. Please login again.");
          return;
        }

        // Authenticated mode - save to database with verified user_id
        const { data: insertedBill, error: billError } = await supabase.from("bills").insert([{
          ...billData,
          bill_items: billItems as unknown as any,
          user_id: currentUserId,
        }]).select("bill_number").single();

        if (billError) throw billError;
        savedBillNumber = insertedBill?.bill_number || "";

        // Update product quantities (only for products, not services)
        for (const item of billItems) {
          if (item.itemType !== "SERVICE") {
            const product = products.find(p => p.id === item.productId);
            if (product) {
              const { error: updateError } = await supabase
                .from("products")
                .update({ quantity: product.quantity - item.quantity })
                .eq("id", item.productId);

              if (updateError) throw updateError;
            }
          }
        }

        // Refresh products and bills
        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: ["bills"] });
      }

      toast.success("✅ Bill saved successfully!");

      // Store bill data for sharing and auto-download PDF
      const pdfData: BillData = {
        billNumber: savedBillNumber,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        items: billItems,
        subTotal,
        discount,
        tax,
        grandTotal,
        paidAmount,
        returnAmount,
        paymentMode,
        billStatus,
        createdAt: new Date().toISOString(),
      };
      
      // Download PDF automatically
      downloadBillPdf(pdfData);
      
      // Store for share dialog
      setLastBillData(pdfData);
      setShowShareDialog(true);
      
      // Reset form
      setBillItems([]);
      setPaidAmount(0);
      setCustomerName("");
      setCustomerPhone("");
      setDiscount(0);
      setTax(0);
      setPaymentMode("CASH");
    } catch (error) {
      console.error("Error saving bill:", error);
      toast.error("Failed to save bill");
    } finally {
      setLoading(false);
    }
  };

  // Refund handlers
  const handleRefund = (bill: Bill) => {
    setSelectedBill(bill);
    setRefundMode("refund");
    setRefundDialogOpen(true);
  };

  const handleReturnItems = (bill: Bill) => {
    setSelectedBill(bill);
    setRefundMode("return");
    setRefundDialogOpen(true);
  };

  const handleCancelBill = (bill: Bill) => {
    setSelectedBill(bill);
    setRefundMode("cancel");
    setRefundDialogOpen(true);
  };

  const handleReceivePayment = (bill: Bill) => {
    setSelectedBill(bill);
    setReceivePaymentDialogOpen(true);
  };

  const processRefund = async (data: RefundData) => {
    setRefundLoading(true);
    try {
      if (isGuest) {
        // Handle guest mode refund
        const bill = bills.find(b => b.id === data.billId);
        if (bill) {
          let newStatus = bill.bill_status;
          let updatedItems = [...(bill.bill_items || [])];

          if (data.refundType === "CANCEL" || data.refundType === "FULL") {
            newStatus = data.refundType === "CANCEL" ? "CANCELLED" : "REFUNDED";
            // Restore inventory for products
            for (const item of updatedItems) {
              if (item.itemType !== "SERVICE") {
                const product = guestProducts.find(p => p.id === item.productId);
                if (product) {
                  updateGuestProduct(item.productId, { quantity: product.quantity + item.quantity });
                }
              }
            }
          } else if (data.refundType === "ITEM_RETURN") {
            newStatus = "PARTIAL_RETURN";
            // Restore inventory for returned items
            for (const returned of data.returnedItems) {
              const product = guestProducts.find(p => p.id === returned.productId);
              const item = updatedItems.find(i => i.productId === returned.productId);
              if (product && item?.itemType !== "SERVICE") {
                updateGuestProduct(returned.productId, { quantity: product.quantity + returned.quantity });
              }
              // Update bill item quantity
              updatedItems = updatedItems.map(i => 
                i.productId === returned.productId 
                  ? { ...i, quantity: i.quantity - returned.quantity, subtotal: (i.quantity - returned.quantity) * i.price }
                  : i
              ).filter(i => i.quantity > 0);
            }
          } else if (data.refundType === "PARTIAL") {
            newStatus = "PARTIAL_REFUND";
          }

          updateGuestBill(data.billId, {
            bill_status: newStatus,
            bill_items: updatedItems,
            total_amount: updatedItems.reduce((sum, i) => sum + i.subtotal, 0),
          });
        }
        
        const updatedProducts = getGuestProducts();
        setGuestProducts(updatedProducts.map(p => ({
          id: p.id,
          product_name: p.product_name,
          price: p.price,
          quantity: p.quantity,
          item_type: p.item_type,
          category: p.category,
        })));
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUserId = session?.user?.id;
        if (!currentUserId) {
          toast.error("Not authenticated");
          return;
        }

        // Get original bill
        const bill = bills.find(b => b.id === data.billId);
        if (!bill) return;

        let newStatus = bill.bill_status;
        let updatedItems = [...(bill.bill_items || [])];
        let newTotal = bill.total_amount;

        if (data.refundType === "CANCEL" || data.refundType === "FULL") {
          newStatus = data.refundType === "CANCEL" ? "CANCELLED" : "REFUNDED";
          // Restore inventory for products
          for (const item of updatedItems) {
            if ((item as any).itemType !== "SERVICE") {
              await supabase
                .from("products")
                .update({ quantity: supabase.rpc ? undefined : 0 }) // Will use raw SQL
                .eq("id", (item as any).productId);
              
              // Get current quantity and add back
              const { data: prod } = await supabase
                .from("products")
                .select("quantity")
                .eq("id", (item as any).productId)
                .single();
              
              if (prod) {
                await supabase
                  .from("products")
                  .update({ quantity: prod.quantity + (item as any).quantity })
                  .eq("id", (item as any).productId);
              }
            }
          }
        } else if (data.refundType === "ITEM_RETURN") {
          newStatus = "PARTIAL_RETURN";
          // Restore inventory for returned items
          for (const returned of data.returnedItems) {
            const item = updatedItems.find(i => (i as any).productId === returned.productId);
            if (item && (item as any).itemType !== "SERVICE") {
              const { data: prod } = await supabase
                .from("products")
                .select("quantity")
                .eq("id", returned.productId)
                .single();
              
              if (prod) {
                await supabase
                  .from("products")
                  .update({ quantity: prod.quantity + returned.quantity })
                  .eq("id", returned.productId);
              }
            }
            // Update bill item quantity
            updatedItems = updatedItems.map(i => 
              (i as any).productId === returned.productId 
                ? { ...i, quantity: (i as any).quantity - returned.quantity, subtotal: ((i as any).quantity - returned.quantity) * (i as any).price }
                : i
            ).filter(i => (i as any).quantity > 0);
          }
          newTotal = updatedItems.reduce((sum, i) => sum + ((i as any).subtotal || 0), 0);
        } else if (data.refundType === "PARTIAL") {
          newStatus = "PARTIAL_REFUND";
        }

        // Create refund record
        await supabase.from("refunds").insert({
          bill_id: data.billId,
          user_id: currentUserId,
          refund_type: data.refundType,
          refund_amount: data.refundAmount,
          payment_mode: data.paymentMode,
          reason: data.reason,
          returned_items: data.returnedItems,
        });

        // Update bill
        await supabase
          .from("bills")
          .update({
            bill_status: newStatus,
            bill_items: updatedItems,
            total_amount: newTotal,
          })
          .eq("id", data.billId);

        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: ["bills"] });
      }

      toast.success("Refund processed successfully!");
      setRefundDialogOpen(false);
      setSelectedBill(null);
    } catch (error) {
      console.error("Refund error:", error);
      toast.error("Failed to process refund");
    } finally {
      setRefundLoading(false);
    }
  };

  const processReceivePayment = async (billId: string, amount: number) => {
    setRefundLoading(true);
    try {
      const bill = bills.find(b => b.id === billId);
      if (!bill) return;

      const grandTotal = bill.total_amount - (bill.discount || 0) + (bill.tax || 0);
      const newPaidAmount = bill.paid_amount + amount;
      const newStatus = newPaidAmount >= grandTotal ? "PAID" : "PARTIAL";
      const newReturnAmount = newPaidAmount > grandTotal ? newPaidAmount - grandTotal : 0;

      if (isGuest) {
        updateGuestBill(billId, {
          paid_amount: newPaidAmount,
          bill_status: newStatus,
          return_amount: newReturnAmount,
          balance_amount: grandTotal - newPaidAmount,
        });
      } else {
        await supabase
          .from("bills")
          .update({
            paid_amount: newPaidAmount,
            bill_status: newStatus,
            return_amount: newReturnAmount,
            balance_amount: Math.max(0, grandTotal - newPaidAmount),
          })
          .eq("id", billId);

        queryClient.invalidateQueries({ queryKey: ["bills"] });
      }

      toast.success("Payment received successfully!");
      if (newReturnAmount > 0) {
        toast.info(`Return ₹${newReturnAmount.toLocaleString("en-IN")} to customer`);
      }
      setReceivePaymentDialogOpen(false);
      setSelectedBill(null);
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to process payment");
    } finally {
      setRefundLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-4 px-4 shadow-lg sticky top-0 z-40">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">Create Bill</h1>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowHistoryDialog(true)}
            >
              <History className="w-4 h-4 mr-1" />
              History
            </Button>
            {isGuest && (
              <span className="text-xs bg-primary-foreground/20 px-2 py-1 rounded">
                Guest
              </span>
            )}
          </div>
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
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {billItems.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No items added. Click "Add Item" to start.
              </p>
            ) : (
              <div className="space-y-3">
                {billItems.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{item.productName}</p>
                        <Badge variant="outline" className="text-xs">
                          {item.itemType === "SERVICE" ? "Service" : "Product"}
                        </Badge>
                      </div>
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

        {/* Payment Mode */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {(["CASH", "ONLINE", "CARD"] as PaymentMode[]).map((mode) => (
                <Button
                  key={mode}
                  variant={paymentMode === mode ? "default" : "outline"}
                  onClick={() => {
                    setPaymentMode(mode);
                    if (mode === "ONLINE" && allQRCodes.length > 0) {
                      setShowPaymentQR(true);
                    }
                  }}
                  className="flex-1"
                >
                  {mode === "CASH" && <Banknote className="w-4 h-4 mr-1" />}
                  {mode === "ONLINE" && <Smartphone className="w-4 h-4 mr-1" />}
                  {mode === "CARD" && <CreditCard className="w-4 h-4 mr-1" />}
                  {mode}
                </Button>
              ))}
            </div>
            {paymentMode === "ONLINE" && allQRCodes.length > 0 && (
              <Button
                variant="outline"
                className="w-full mt-3"
                onClick={() => setShowPaymentQR(true)}
              >
                <QrCode className="w-4 h-4 mr-2" />
                Show Payment QR Code
              </Button>
            )}
            {paymentMode === "ONLINE" && allQRCodes.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Add payment QR codes in Settings → Payment QR Codes
              </p>
            )}
          </CardContent>
        </Card>

        {/* Bill Summary */}
        <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="pt-6 space-y-4">
            <div className="flex justify-between items-center">
              <span>Subtotal:</span>
              <span className="font-semibold">₹{subTotal.toLocaleString('en-IN')}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="discount" className="text-xs flex items-center gap-1">
                  <Percent className="w-3 h-3" /> Discount (₹)
                </Label>
                <Input
                  id="discount"
                  type="number"
                  min={0}
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="tax" className="text-xs">Tax (₹)</Label>
                <Input
                  id="tax"
                  type="number"
                  min={0}
                  value={tax}
                  onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-lg border-t pt-3">
              <span className="font-semibold">Grand Total:</span>
              <span className="font-bold text-primary text-xl">
                ₹{grandTotal.toLocaleString('en-IN')}
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
              <div className="flex gap-2 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPaidAmount(grandTotal)}
                >
                  Exact Amount
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPaidAmount(0)}
                >
                  Unpaid
                </Button>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <div className="flex justify-between items-center">
                <span>Status:</span>
                <Badge
                  className={
                    billStatus === "PAID"
                      ? "bg-green-500"
                      : billStatus === "PARTIAL"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }
                >
                  {billStatus}
                </Badge>
              </div>
              {returnAmount > 0 && (
                <div className="flex justify-between items-center text-lg">
                  <span className="font-semibold">Return to Customer:</span>
                  <Badge className="bg-accent text-lg px-4 py-2">
                    ₹{returnAmount.toLocaleString('en-IN')}
                  </Badge>
                </div>
              )}
              {billStatus === "PARTIAL" && (
                <div className="flex justify-between items-center">
                  <span>Remaining Balance:</span>
                  <span className="text-destructive font-semibold">
                    ₹{(grandTotal - paidAmount).toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleSaveBill}
          disabled={loading || billItems.length === 0}
          className="w-full bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-accent-foreground font-semibold py-6"
        >
          <Receipt className="w-5 h-5 mr-2" />
          {loading ? "Saving Bill..." : "Save Bill & Generate PDF"}
        </Button>
      </div>

      {/* Product Selection Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Product / Service</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products & services..."
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setShowProductDialog(false);
                setShowBarcodeScanner(true);
              }}
              className="shrink-0"
            >
              <ScanBarcode className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2">
            {filteredProducts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No items available
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
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{product.product_name}</p>
                      <Badge variant="outline" className="text-xs">
                        {product.item_type === "SERVICE" ? "Service" : "Product"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      ₹{product.price}
                      {product.item_type !== "SERVICE" && ` • Stock: ${product.quantity}`}
                      {product.barcode && ` • ${product.barcode}`}
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

      {/* Bill History Dialog */}
      <BillHistoryDialog
        open={showHistoryDialog}
        onOpenChange={setShowHistoryDialog}
        bills={bills}
        onRefund={handleRefund}
        onReturnItems={handleReturnItems}
        onCancel={handleCancelBill}
        onReceivePayment={handleReceivePayment}
      />

      {/* Refund Dialog */}
      <RefundDialog
        open={refundDialogOpen}
        onOpenChange={setRefundDialogOpen}
        bill={selectedBill}
        mode={refundMode}
        onSubmit={processRefund}
        loading={refundLoading}
      />

      {/* Receive Payment Dialog */}
      <ReceivePaymentDialog
        open={receivePaymentDialogOpen}
        onOpenChange={setReceivePaymentDialogOpen}
        bill={selectedBill}
        onSubmit={processReceivePayment}
        loading={refundLoading}
      />

      {/* Share Bill Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share Bill
            </DialogTitle>
          </DialogHeader>
          {lastBillData && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Bill <strong>{lastBillData.billNumber}</strong> saved! Share it with your customer:
              </p>
              
              <div className="grid gap-3">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => {
                    shareViaWhatsApp(lastBillData, lastBillData.customerPhone);
                    setShowShareDialog(false);
                  }}
                >
                  <MessageCircle className="w-5 h-5 mr-3 text-green-600" />
                  Send via WhatsApp
                </Button>
                
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => {
                    shareViaSMS(lastBillData, lastBillData.customerPhone);
                    setShowShareDialog(false);
                  }}
                >
                  <MessageSquare className="w-5 h-5 mr-3 text-blue-600" />
                  Send via SMS / Text
                </Button>
                
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => {
                    shareBillPdf(lastBillData);
                    setShowShareDialog(false);
                  }}
                >
                  <Share2 className="w-5 h-5 mr-3" />
                  Share PDF
                </Button>
              </div>
              
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setShowShareDialog(false)}
              >
                <X className="w-4 h-4 mr-2" />
                Skip
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Barcode Scanner */}
      <BarcodeScanner
        open={showBarcodeScanner}
        onOpenChange={setShowBarcodeScanner}
        onScan={handleBarcodeScan}
        title="Scan Product Barcode"
      />

      {/* Payment QR Code Dialog */}
      <Dialog open={showPaymentQR} onOpenChange={setShowPaymentQR}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Payment QR Code
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {allQRCodes.map((qr: any) => (
              <div key={qr.id} className="text-center">
                <img
                  src={qr.image_url}
                  alt={qr.label}
                  className="w-full max-w-[250px] mx-auto aspect-square object-contain rounded-lg border p-2"
                />
                <p className="text-sm font-medium mt-2">{qr.label}</p>
              </div>
            ))}
            <p className="text-xs text-muted-foreground text-center">
              Show this QR code to the customer for payment
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default Billing;
