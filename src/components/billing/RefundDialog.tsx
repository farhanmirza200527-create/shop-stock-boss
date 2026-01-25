import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { Bill } from "./BillHistoryDialog";

interface RefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill: Bill | null;
  mode: "refund" | "return" | "cancel";
  onSubmit: (data: RefundData) => void;
  loading?: boolean;
}

interface RefundData {
  billId: string;
  refundType: "FULL" | "PARTIAL" | "ITEM_RETURN" | "CANCEL";
  refundAmount: number;
  paymentMode: string;
  reason: string;
  returnedItems: { productId: string; quantity: number; subtotal: number }[];
}

const RefundDialog = ({
  open,
  onOpenChange,
  bill,
  mode,
  onSubmit,
  loading,
}: RefundDialogProps) => {
  const [refundType, setRefundType] = useState<"FULL" | "PARTIAL">("FULL");
  const [partialAmount, setPartialAmount] = useState(0);
  const [reason, setReason] = useState("");
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});

  if (!bill) return null;

  const grandTotal = bill.total_amount - (bill.discount || 0) + (bill.tax || 0);
  const maxRefundable = bill.paid_amount;

  const handleItemToggle = (productId: string, checked: boolean, maxQty: number, price: number) => {
    if (checked) {
      setSelectedItems((prev) => ({ ...prev, [productId]: maxQty }));
    } else {
      setSelectedItems((prev) => {
        const newItems = { ...prev };
        delete newItems[productId];
        return newItems;
      });
    }
  };

  const handleItemQtyChange = (productId: string, qty: number, maxQty: number) => {
    if (qty > 0 && qty <= maxQty) {
      setSelectedItems((prev) => ({ ...prev, [productId]: qty }));
    }
  };

  const calculateReturnTotal = () => {
    return (bill.bill_items || []).reduce((sum: number, item: any) => {
      const qty = selectedItems[item.productId] || 0;
      return sum + qty * item.price;
    }, 0);
  };

  const handleSubmit = () => {
    let refundAmount = 0;
    let type: RefundData["refundType"] = "FULL";
    const returnedItems: RefundData["returnedItems"] = [];

    if (mode === "cancel") {
      refundAmount = bill.paid_amount;
      type = "CANCEL";
    } else if (mode === "return") {
      refundAmount = calculateReturnTotal();
      type = "ITEM_RETURN";
      
      if (Object.keys(selectedItems).length === 0) {
        toast.error("Please select items to return");
        return;
      }

      Object.entries(selectedItems).forEach(([productId, qty]) => {
        const item = (bill.bill_items || []).find((i: any) => i.productId === productId);
        if (item) {
          returnedItems.push({
            productId,
            quantity: qty,
            subtotal: qty * item.price,
          });
        }
      });
    } else {
      if (refundType === "FULL") {
        refundAmount = maxRefundable;
        type = "FULL";
      } else {
        if (partialAmount <= 0 || partialAmount > maxRefundable) {
          toast.error(`Refund amount must be between ₹1 and ₹${maxRefundable}`);
          return;
        }
        refundAmount = partialAmount;
        type = "PARTIAL";
      }
    }

    onSubmit({
      billId: bill.id,
      refundType: type,
      refundAmount,
      paymentMode: bill.payment_mode,
      reason,
      returnedItems,
    });
  };

  const getTitle = () => {
    switch (mode) {
      case "cancel":
        return "Cancel Bill";
      case "return":
        return "Return Items";
      default:
        return "Process Refund";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex justify-between">
              <span className="text-sm">{bill.bill_number}</span>
              <Badge>{bill.bill_status}</Badge>
            </div>
            <p className="font-bold mt-1">Total: ₹{grandTotal.toLocaleString("en-IN")}</p>
            <p className="text-sm text-muted-foreground">
              Paid: ₹{bill.paid_amount.toLocaleString("en-IN")} ({bill.payment_mode})
            </p>
          </div>

          {mode === "return" && (
            <div className="space-y-2">
              <Label>Select Items to Return</Label>
              <ScrollArea className="h-48 border rounded-lg p-3">
                {(bill.bill_items || []).map((item: any) => (
                  <div
                    key={item.productId}
                    className="flex items-center gap-3 py-2 border-b last:border-0"
                  >
                    <Checkbox
                      checked={!!selectedItems[item.productId]}
                      onCheckedChange={(checked) =>
                        handleItemToggle(
                          item.productId,
                          !!checked,
                          item.quantity,
                          item.price
                        )
                      }
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        ₹{item.price} × {item.quantity}
                      </p>
                    </div>
                    {selectedItems[item.productId] && (
                      <Input
                        type="number"
                        min={1}
                        max={item.quantity}
                        value={selectedItems[item.productId]}
                        onChange={(e) =>
                          handleItemQtyChange(
                            item.productId,
                            parseInt(e.target.value) || 1,
                            item.quantity
                          )
                        }
                        className="w-16 text-center"
                      />
                    )}
                  </div>
                ))}
              </ScrollArea>
              {Object.keys(selectedItems).length > 0 && (
                <p className="text-right font-semibold">
                  Refund Amount: ₹{calculateReturnTotal().toLocaleString("en-IN")}
                </p>
              )}
            </div>
          )}

          {mode === "refund" && (
            <div className="space-y-3">
              <Label>Refund Type</Label>
              <RadioGroup
                value={refundType}
                onValueChange={(v) => setRefundType(v as "FULL" | "PARTIAL")}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="FULL" id="full" />
                  <Label htmlFor="full" className="font-normal">
                    Full Refund (₹{maxRefundable.toLocaleString("en-IN")})
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PARTIAL" id="partial" />
                  <Label htmlFor="partial" className="font-normal">
                    Partial Refund
                  </Label>
                </div>
              </RadioGroup>

              {refundType === "PARTIAL" && (
                <div>
                  <Label htmlFor="amount">Refund Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min={1}
                    max={maxRefundable}
                    value={partialAmount}
                    onChange={(e) => setPartialAmount(parseFloat(e.target.value) || 0)}
                    placeholder="Enter amount"
                  />
                </div>
              )}
            </div>
          )}

          {mode === "cancel" && (
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-sm text-destructive font-medium">
                ⚠️ This will cancel the entire bill and refund ₹{bill.paid_amount.toLocaleString("en-IN")} to the customer.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                All product items will be restored to inventory.
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for refund/return..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            variant={mode === "cancel" ? "destructive" : "default"}
          >
            {loading
              ? "Processing..."
              : mode === "cancel"
              ? "Confirm Cancellation"
              : mode === "return"
              ? "Process Return"
              : "Process Refund"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RefundDialog;
export type { RefundData };
