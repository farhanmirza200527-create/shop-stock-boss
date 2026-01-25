import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  Share2, 
  Download, 
  RotateCcw, 
  XCircle, 
  Eye,
  CreditCard,
  Banknote,
  Smartphone
} from "lucide-react";
import { downloadBillPdf, shareBillPdf, BillData } from "./BillPdfGenerator";

interface Bill {
  id: string;
  bill_number: string;
  customer_name?: string;
  customer_phone?: string;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  return_amount: number;
  discount: number;
  tax: number;
  bill_items: any[];
  payment_mode: string;
  bill_status: string;
  created_at: string;
}

interface BillHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bills: Bill[];
  shopName?: string;
  shopAddress?: string;
  onRefund: (bill: Bill) => void;
  onReturnItems: (bill: Bill) => void;
  onCancel: (bill: Bill) => void;
  onReceivePayment: (bill: Bill) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "PAID":
      return "bg-green-500";
    case "PARTIAL":
      return "bg-yellow-500";
    case "UNPAID":
      return "bg-red-500";
    case "CANCELLED":
      return "bg-gray-500";
    case "REFUNDED":
      return "bg-purple-500";
    case "PARTIAL_RETURN":
      return "bg-orange-500";
    default:
      return "bg-muted";
  }
};

const getPaymentIcon = (mode: string) => {
  switch (mode) {
    case "CASH":
      return <Banknote className="w-4 h-4" />;
    case "CARD":
      return <CreditCard className="w-4 h-4" />;
    case "ONLINE":
      return <Smartphone className="w-4 h-4" />;
    default:
      return <Banknote className="w-4 h-4" />;
  }
};

const BillHistoryDialog = ({
  open,
  onOpenChange,
  bills,
  shopName,
  shopAddress,
  onRefund,
  onReturnItems,
  onCancel,
  onReceivePayment,
}: BillHistoryDialogProps) => {
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  const prepareBillData = (bill: Bill): BillData => ({
    billNumber: bill.bill_number || `BILL-${bill.id.slice(0, 8)}`,
    customerName: bill.customer_name,
    customerPhone: bill.customer_phone,
    items: bill.bill_items || [],
    subTotal: bill.total_amount,
    discount: bill.discount || 0,
    tax: bill.tax || 0,
    grandTotal: bill.total_amount - (bill.discount || 0) + (bill.tax || 0),
    paidAmount: bill.paid_amount,
    returnAmount: bill.return_amount || 0,
    paymentMode: bill.payment_mode || "CASH",
    billStatus: bill.bill_status || "PAID",
    createdAt: bill.created_at,
    shopName,
    shopAddress,
  });

  const handleDownload = (bill: Bill) => {
    downloadBillPdf(prepareBillData(bill));
  };

  const handleShare = (bill: Bill) => {
    shareBillPdf(prepareBillData(bill));
  };

  const canRefund = (status: string) => {
    return status === "PAID" || status === "PARTIAL";
  };

  const canCancel = (status: string) => {
    return status !== "CANCELLED" && status !== "REFUNDED";
  };

  const canReceivePayment = (status: string) => {
    return status === "PARTIAL" || status === "UNPAID";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Bill History
          </DialogTitle>
        </DialogHeader>

        {!selectedBill ? (
          <ScrollArea className="flex-1 max-h-[60vh]">
            <div className="space-y-3 pr-4">
              {bills.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No bills found
                </p>
              ) : (
                bills.map((bill) => (
                  <div
                    key={bill.id}
                    className="p-4 bg-muted/50 rounded-lg space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-sm">
                          {bill.bill_number || `BILL-${bill.id.slice(0, 8)}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(bill.created_at).toLocaleString("en-IN")}
                        </p>
                        {bill.customer_name && (
                          <p className="text-sm mt-1">{bill.customer_name}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          ₹{bill.total_amount.toLocaleString("en-IN")}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {getPaymentIcon(bill.payment_mode)}
                          <Badge className={getStatusColor(bill.bill_status)}>
                            {bill.bill_status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedBill(bill)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(bill)}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        PDF
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleShare(bill)}
                      >
                        <Share2 className="w-3 h-3 mr-1" />
                        Share
                      </Button>
                      {canReceivePayment(bill.bill_status) && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => onReceivePayment(bill)}
                        >
                          Receive Payment
                        </Button>
                      )}
                    </div>

                    {canRefund(bill.bill_status) && (
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onReturnItems(bill)}
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Return Items
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onRefund(bill)}
                        >
                          Refund
                        </Button>
                        {canCancel(bill.bill_status) && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onCancel(bill)}
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedBill(null)}
            >
              ← Back to List
            </Button>

            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">
                    {selectedBill.bill_number}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedBill.created_at).toLocaleString("en-IN")}
                  </p>
                </div>
                <Badge className={getStatusColor(selectedBill.bill_status)}>
                  {selectedBill.bill_status}
                </Badge>
              </div>

              {selectedBill.customer_name && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium">
                    {selectedBill.customer_name}
                  </p>
                  {selectedBill.customer_phone && (
                    <p className="text-sm text-muted-foreground">
                      {selectedBill.customer_phone}
                    </p>
                  )}
                </div>
              )}

              <ScrollArea className="h-40">
                <div className="space-y-2">
                  {(selectedBill.bill_items || []).map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex justify-between text-sm p-2 bg-muted/30 rounded"
                    >
                      <span>
                        {item.productName} × {item.quantity}
                      </span>
                      <span>₹{item.subtotal?.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="space-y-2 pt-3 border-t">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{selectedBill.total_amount.toLocaleString("en-IN")}</span>
                </div>
                {selectedBill.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>- ₹{selectedBill.discount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                {selectedBill.tax > 0 && (
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>+ ₹{selectedBill.tax.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>Grand Total</span>
                  <span>
                    ₹{(selectedBill.total_amount - (selectedBill.discount || 0) + (selectedBill.tax || 0)).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Paid ({selectedBill.payment_mode})</span>
                  <span>₹{selectedBill.paid_amount.toLocaleString("en-IN")}</span>
                </div>
                {selectedBill.return_amount > 0 && (
                  <div className="flex justify-between text-primary">
                    <span>Return/Change</span>
                    <span>₹{selectedBill.return_amount.toLocaleString("en-IN")}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-3">
                <Button
                  className="flex-1"
                  onClick={() => handleDownload(selectedBill)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => handleShare(selectedBill)}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BillHistoryDialog;
export type { Bill };
