-- Add new columns to bills table
ALTER TABLE public.bills 
ADD COLUMN IF NOT EXISTS bill_number TEXT,
ADD COLUMN IF NOT EXISTS payment_mode TEXT DEFAULT 'CASH',
ADD COLUMN IF NOT EXISTS bill_status TEXT DEFAULT 'PAID',
ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS return_amount NUMERIC DEFAULT 0;

-- Create refunds table
CREATE TABLE public.refunds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  refund_type TEXT NOT NULL, -- 'FULL', 'PARTIAL', 'ITEM_RETURN', 'CANCEL'
  refund_amount NUMERIC NOT NULL DEFAULT 0,
  payment_mode TEXT NOT NULL, -- matches original bill payment mode
  reason TEXT,
  returned_items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on refunds
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for refunds
CREATE POLICY "Users can read own refunds"
ON public.refunds
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own refunds"
ON public.refunds
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own refunds"
ON public.refunds
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own refunds"
ON public.refunds
FOR DELETE
USING (user_id = auth.uid());

-- Create function to generate bill numbers
CREATE OR REPLACE FUNCTION public.generate_bill_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.bill_number = 'BILL-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for auto bill number
CREATE TRIGGER set_bill_number
BEFORE INSERT ON public.bills
FOR EACH ROW
WHEN (NEW.bill_number IS NULL)
EXECUTE FUNCTION public.generate_bill_number();