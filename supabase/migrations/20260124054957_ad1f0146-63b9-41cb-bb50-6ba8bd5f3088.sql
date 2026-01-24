-- Create pending_payments table for customer payment tracking
CREATE TABLE public.pending_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  total_pending NUMERIC NOT NULL DEFAULT 0 CHECK (total_pending >= 0),
  total_advance NUMERIC NOT NULL DEFAULT 0 CHECK (total_advance >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, customer_phone)
);

-- Create pending_payment_history table for transaction history
CREATE TABLE public.pending_payment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pending_payment_id UUID NOT NULL REFERENCES public.pending_payments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('PENDING_ADD', 'PAYMENT_RECEIVED', 'ADVANCE_ADD', 'ADJUSTMENT')),
  amount NUMERIC NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pending_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_payment_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for pending_payments
CREATE POLICY "Users can read own pending payments"
ON public.pending_payments
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own pending payments"
ON public.pending_payments
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pending payments"
ON public.pending_payments
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own pending payments"
ON public.pending_payments
FOR DELETE
USING (user_id = auth.uid());

-- Create RLS policies for pending_payment_history
CREATE POLICY "Users can read own payment history"
ON public.pending_payment_history
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own payment history"
ON public.pending_payment_history
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own payment history"
ON public.pending_payment_history
FOR DELETE
USING (user_id = auth.uid());

-- Create updated_at trigger for pending_payments
CREATE TRIGGER update_pending_payments_updated_at
BEFORE UPDATE ON public.pending_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();