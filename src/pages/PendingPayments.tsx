import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGuestData } from "@/hooks/useGuestData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Minus, DollarSign, Users, History, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

interface PendingPayment {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  total_pending: number;
  total_advance: number;
  created_at: string;
}

interface PaymentHistory {
  id: string;
  entry_type: string;
  amount: number;
  note: string | null;
  created_at: string;
}

const PendingPayments = () => {
  const { isGuest } = useAuth();
  const guestData = useGuestData();
  const queryClient = useQueryClient();

  const [isAddPendingOpen, setIsAddPendingOpen] = useState(false);
  const [isReceivePaymentOpen, setIsReceivePaymentOpen] = useState(false);
  const [isAddAdvanceOpen, setIsAddAdvanceOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedCustomerName, setSelectedCustomerName] = useState("");

  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newNote, setNewNote] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState("");

  const { data: pendingPayments, isLoading } = useQuery({
    queryKey: ["pending-payments"],
    queryFn: async () => {
      if (isGuest) return guestData.getPendingPayments();
      const { data, error } = await supabase
        .from("pending_payments")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as PendingPayment[];
    },
  });

  const { data: paymentHistory } = useQuery({
    queryKey: ["payment-history", selectedCustomerId],
    queryFn: async () => {
      if (!selectedCustomerId) return [];
      if (isGuest) return guestData.getPaymentHistory(selectedCustomerId);
      const { data, error } = await supabase
        .from("pending_payment_history")
        .select("*")
        .eq("pending_payment_id", selectedCustomerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PaymentHistory[];
    },
    enabled: !!selectedCustomerId,
  });

  const addPendingMutation = useMutation({
    mutationFn: async ({ customerName, customerPhone, amount, note }: { customerName: string; customerPhone: string; amount: number; note: string }) => {
      if (isGuest) return guestData.addPendingPayment(customerName, customerPhone, amount, note);

      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) throw new Error("Not authenticated");

      const { data: existing } = await supabase.from("pending_payments").select("*").eq("user_id", userId).eq("customer_name", customerName).maybeSingle();

      if (existing) {
        let actualPendingAmount = amount;
        if (existing.total_advance > 0) {
          if (existing.total_advance >= amount) {
            await supabase.from("pending_payments").update({ total_advance: existing.total_advance - amount }).eq("id", existing.id);
            await supabase.from("pending_payment_history").insert({ pending_payment_id: existing.id, user_id: userId, entry_type: "ADJUSTMENT", amount, note: `Advance adjusted automatically` });
            return { adjusted: true };
          } else {
            actualPendingAmount = amount - existing.total_advance;
            await supabase.from("pending_payments").update({ total_pending: existing.total_pending + actualPendingAmount, total_advance: 0 }).eq("id", existing.id);
            await supabase.from("pending_payment_history").insert({ pending_payment_id: existing.id, user_id: userId, entry_type: "ADJUSTMENT", amount: existing.total_advance, note: `Advance of ₹${existing.total_advance} adjusted` });
          }
        } else {
          await supabase.from("pending_payments").update({ total_pending: existing.total_pending + amount }).eq("id", existing.id);
        }
        if (actualPendingAmount > 0) {
          await supabase.from("pending_payment_history").insert({ pending_payment_id: existing.id, user_id: userId, entry_type: "PENDING_ADD", amount: actualPendingAmount, note: note || null });
        }
      } else {
        const { data: newPayment, error } = await supabase.from("pending_payments").insert({ user_id: userId, customer_name: customerName, customer_phone: customerPhone || null, total_pending: amount, total_advance: 0 }).select().single();
        if (error) throw error;
        await supabase.from("pending_payment_history").insert({ pending_payment_id: newPayment.id, user_id: userId, entry_type: "PENDING_ADD", amount, note: note || null });
      }
      return { success: true };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["pending-payments"] });
      setIsAddPendingOpen(false);
      setNewCustomerName(""); setNewCustomerPhone(""); setNewAmount(""); setNewNote("");
      toast({ title: result?.adjusted ? "Amount Adjusted" : "Pending Added", description: result?.adjusted ? "Advance was used to cover the pending amount" : "Pending payment has been recorded" });
    },
    onError: (error: any) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const receivePaymentMutation = useMutation({
    mutationFn: async ({ customerId, amount }: { customerId: string; amount: number }) => {
      if (isGuest) return guestData.receivePayment(customerId, amount);

      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) throw new Error("Not authenticated");

      const { data: existing } = await supabase.from("pending_payments").select("*").eq("id", customerId).single();
      if (!existing) throw new Error("Customer not found");

      let newPending = existing.total_pending, newAdvance = existing.total_advance, extra = 0;
      if (amount <= existing.total_pending) { newPending = existing.total_pending - amount; }
      else { extra = amount - existing.total_pending; newPending = 0; newAdvance = existing.total_advance + extra; }

      await supabase.from("pending_payments").update({ total_pending: newPending, total_advance: newAdvance }).eq("id", customerId);
      await supabase.from("pending_payment_history").insert({ pending_payment_id: customerId, user_id: userId, entry_type: "PAYMENT_RECEIVED", amount, note: extra > 0 ? `Excess ₹${extra} added to advance` : null });
      return { extra };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["pending-payments"] });
      queryClient.invalidateQueries({ queryKey: ["payment-history"] });
      setIsReceivePaymentOpen(false); setPaymentAmount("");
      toast({ title: "Payment Received", description: result?.extra && result.extra > 0 ? `Payment recorded. ₹${result.extra} added to advance.` : "Payment has been recorded successfully" });
    },
    onError: (error: any) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const addAdvanceMutation = useMutation({
    mutationFn: async ({ customerId, customerName, customerPhone, amount }: { customerId?: string; customerName: string; customerPhone: string; amount: number }) => {
      if (isGuest) return guestData.addAdvance(customerId, customerName, customerPhone, amount);

      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) throw new Error("Not authenticated");

      if (customerId) {
        const { data: existing } = await supabase.from("pending_payments").select("*").eq("id", customerId).single();
        if (!existing) throw new Error("Customer not found");
        await supabase.from("pending_payments").update({ total_advance: existing.total_advance + amount }).eq("id", customerId);
        await supabase.from("pending_payment_history").insert({ pending_payment_id: customerId, user_id: userId, entry_type: "ADVANCE_ADD", amount, note: null });
      } else {
        const { data: newPayment, error } = await supabase.from("pending_payments").insert({ user_id: userId, customer_name: customerName, customer_phone: customerPhone || null, total_pending: 0, total_advance: amount }).select().single();
        if (error) throw error;
        await supabase.from("pending_payment_history").insert({ pending_payment_id: newPayment.id, user_id: userId, entry_type: "ADVANCE_ADD", amount, note: null });
      }
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-payments"] });
      setIsAddAdvanceOpen(false); setAdvanceAmount(""); setNewCustomerName(""); setNewCustomerPhone(""); setSelectedCustomerId("");
      toast({ title: "Advance Added", description: "Advance payment has been recorded" });
    },
    onError: (error: any) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const handleAddPending = () => {
    if (!newCustomerName.trim() || !newAmount) { toast({ title: "Validation Error", description: "Customer name and amount are required", variant: "destructive" }); return; }
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount <= 0) { toast({ title: "Validation Error", description: "Amount must be greater than 0", variant: "destructive" }); return; }
    addPendingMutation.mutate({ customerName: newCustomerName.trim(), customerPhone: newCustomerPhone.trim(), amount, note: newNote.trim() });
  };

  const handleReceivePayment = () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) { toast({ title: "Validation Error", description: "Amount must be greater than 0", variant: "destructive" }); return; }
    receivePaymentMutation.mutate({ customerId: selectedCustomerId, amount });
  };

  const handleAddAdvance = () => {
    const amount = parseFloat(advanceAmount);
    if (isNaN(amount) || amount <= 0) { toast({ title: "Validation Error", description: "Amount must be greater than 0", variant: "destructive" }); return; }
    addAdvanceMutation.mutate({ customerId: selectedCustomerId || undefined, customerName: newCustomerName.trim(), customerPhone: newCustomerPhone.trim(), amount });
  };

  const totalPendingSum = pendingPayments?.reduce((sum, p) => sum + Number(p.total_pending), 0) || 0;
  const totalAdvanceSum = pendingPayments?.reduce((sum, p) => sum + Number(p.total_advance), 0) || 0;
  const customersWithPending = pendingPayments?.filter((p) => Number(p.total_pending) > 0).length || 0;

  const getStatusColor = (pending: number, advance: number) => {
    if (pending > 0) return "text-destructive bg-destructive/10";
    if (advance > 0) return "text-green-600 bg-green-50 dark:bg-green-950";
    return "text-muted-foreground bg-muted";
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-4 px-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link to="/"><Button variant="ghost" size="icon" className="text-primary-foreground"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold">Pending Payments</h1>
            <p className="text-sm opacity-90">Track customer balances & advances</p>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
              <DollarSign className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">₹{totalPendingSum.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{customersWithPending} customers</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Advance</CardTitle>
              <Wallet className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₹{totalAdvanceSum.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Available balance</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{pendingPayments?.length || 0}</div>
              <p className="text-xs text-muted-foreground">With payment records</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <Dialog open={isAddPendingOpen} onOpenChange={setIsAddPendingOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" />Add Pending</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add New Pending Amount</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div><Label>Customer Name *</Label><Input value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} placeholder="Enter customer name" /></div>
                <div><Label>Phone (Optional)</Label><Input value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} placeholder="Enter phone number" /></div>
                <div><Label>Amount *</Label><Input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="Enter amount" min="0" step="0.01" /></div>
                <div><Label>Note (Optional)</Label><Textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add a note..." /></div>
                <Button onClick={handleAddPending} className="w-full" disabled={addPendingMutation.isPending}>{addPendingMutation.isPending ? "Adding..." : "Add Pending"}</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddAdvanceOpen} onOpenChange={(open) => { setIsAddAdvanceOpen(open); if (!open) { setSelectedCustomerId(""); setNewCustomerName(""); setNewCustomerPhone(""); } }}>
            <DialogTrigger asChild><Button variant="outline" className="gap-2"><Wallet className="h-4 w-4" />Add Advance</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Advance Payment</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Select Customer</Label>
                  <Select value={selectedCustomerId} onValueChange={(value) => setSelectedCustomerId(value === "new" ? "" : value)}>
                    <SelectTrigger><SelectValue placeholder="Select or add new customer" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">➕ New Customer</SelectItem>
                      {pendingPayments?.map((p) => (<SelectItem key={p.id} value={p.id}>{p.customer_name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                {!selectedCustomerId && (
                  <>
                    <div><Label>Customer Name *</Label><Input value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} placeholder="Enter customer name" /></div>
                    <div><Label>Phone (Optional)</Label><Input value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} placeholder="Enter phone number" /></div>
                  </>
                )}
                <div><Label>Advance Amount *</Label><Input type="number" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} placeholder="Enter advance amount" min="0" step="0.01" /></div>
                <Button onClick={handleAddAdvance} className="w-full" disabled={addAdvanceMutation.isPending}>{addAdvanceMutation.isPending ? "Adding..." : "Add Advance"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Customers</h2>
          {isLoading ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>
          ) : pendingPayments && pendingPayments.length > 0 ? (
            <div className="grid gap-4">
              {pendingPayments.map((payment) => (
                <Card key={payment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{payment.customer_name}</h3>
                        {payment.customer_phone && <p className="text-sm text-muted-foreground">{payment.customer_phone}</p>}
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className={`text-sm px-2 py-1 rounded ${getStatusColor(Number(payment.total_pending), Number(payment.total_advance))}`}>
                            Pending: ₹{Number(payment.total_pending).toFixed(2)}
                          </span>
                          {Number(payment.total_advance) > 0 && (
                            <span className="text-sm px-2 py-1 rounded text-green-600 bg-green-50 dark:bg-green-950">Advance: ₹{Number(payment.total_advance).toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Dialog open={isReceivePaymentOpen && selectedCustomerId === payment.id} onOpenChange={(open) => { setIsReceivePaymentOpen(open); if (open) { setSelectedCustomerId(payment.id); setSelectedCustomerName(payment.customer_name); } }}>
                          <DialogTrigger asChild><Button size="sm" variant="outline" className="gap-1"><Minus className="h-3 w-3" />Receive</Button></DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Receive Payment from {selectedCustomerName}</DialogTitle></DialogHeader>
                            <div className="space-y-4 pt-4">
                              <div className="p-3 bg-muted rounded-lg">
                                <p className="text-sm">Current Pending: <strong className="text-destructive">₹{Number(payment.total_pending).toFixed(2)}</strong></p>
                                <p className="text-sm">Current Advance: <strong className="text-green-600">₹{Number(payment.total_advance).toFixed(2)}</strong></p>
                              </div>
                              <div><Label>Amount Received *</Label><Input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="Enter amount" min="0" step="0.01" /></div>
                              <p className="text-xs text-muted-foreground">If amount exceeds pending, excess will be added to advance.</p>
                              <Button onClick={handleReceivePayment} className="w-full" disabled={receivePaymentMutation.isPending}>{receivePaymentMutation.isPending ? "Processing..." : "Receive Payment"}</Button>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Dialog open={isHistoryOpen && selectedCustomerId === payment.id} onOpenChange={(open) => { setIsHistoryOpen(open); if (open) { setSelectedCustomerId(payment.id); setSelectedCustomerName(payment.customer_name); } }}>
                          <DialogTrigger asChild><Button size="sm" variant="ghost" className="gap-1"><History className="h-3 w-3" />History</Button></DialogTrigger>
                          <DialogContent className="max-h-[80vh] overflow-y-auto">
                            <DialogHeader><DialogTitle>Payment History - {selectedCustomerName}</DialogTitle></DialogHeader>
                            <div className="space-y-3 pt-4">
                              {paymentHistory && paymentHistory.length > 0 ? (
                                paymentHistory.map((entry) => (
                                  <div key={entry.id} className="p-3 border rounded-lg text-sm">
                                    <div className="flex justify-between items-start">
                                      <span className={`font-medium ${entry.entry_type === "PAYMENT_RECEIVED" ? "text-green-600" : entry.entry_type === "PENDING_ADD" ? "text-destructive" : entry.entry_type === "ADVANCE_ADD" ? "text-primary" : "text-orange-600"}`}>
                                        {entry.entry_type.replace("_", " ")}
                                      </span>
                                      <span className="font-bold">₹{Number(entry.amount).toFixed(2)}</span>
                                    </div>
                                    {entry.note && <p className="text-muted-foreground mt-1">{entry.note}</p>}
                                    <p className="text-xs text-muted-foreground mt-1">{new Date(entry.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                                  </div>
                                ))
                              ) : (
                                <p className="text-center text-muted-foreground py-4">No history available</p>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No pending payments recorded yet. Add your first entry!</CardContent></Card>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default PendingPayments;
