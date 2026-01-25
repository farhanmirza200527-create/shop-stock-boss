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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { Bill } from "./BillHistoryDialog";

interface ReceivePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill: Bill | null;
  onSubmit: (billId: string, amount: number) => void;
  loading?: boolean;
}

const ReceivePaymentDialog = ({
  open,
  onOpenChange,
  bill,
  onSubmit,
  loading,
}: ReceivePaymentDialogProps) => {
  const [amount, setAmount] = useState(0);

  if (!bill) return null;

  const grandTotal = bill.total_amount - (bill.discount || 0) + (bill.tax || 0);
  const remaining = grandTotal - bill.paid_amount;

  const handleSubmit = () => {
    if (amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    onSubmit(bill.id, amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Receive Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-muted/50 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">{bill.bill_number}</span>
              <Badge>{bill.bill_status}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Grand Total:</span>
              <span className="font-semibold">₹{grandTotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span>Already Paid:</span>
              <span>₹{bill.paid_amount.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-primary font-bold">
              <span>Remaining:</span>
              <span>₹{remaining.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div>
            <Label htmlFor="payment">Payment Amount (₹)</Label>
            <Input
              id="payment"
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              placeholder="Enter amount received"
              className="text-lg"
            />
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => setAmount(remaining)}
            >
              Pay Full (₹{remaining.toLocaleString("en-IN")})
            </Button>
          </div>

          {amount > remaining && (
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-300">
                Return to customer: ₹{(amount - remaining).toLocaleString("en-IN")}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Processing..." : "Receive Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReceivePaymentDialog;
