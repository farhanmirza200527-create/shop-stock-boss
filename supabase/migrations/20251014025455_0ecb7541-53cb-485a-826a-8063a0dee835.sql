-- Create bills table for customer transactions
CREATE TABLE public.bills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT,
  customer_phone TEXT,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  balance_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  bill_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

-- Create policies for full access (no authentication required)
CREATE POLICY "Enable read access for all" 
ON public.bills 
FOR SELECT 
USING (true);

CREATE POLICY "Enable insert access for all" 
ON public.bills 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Enable update access for all" 
ON public.bills 
FOR UPDATE 
USING (true);

CREATE POLICY "Enable delete access for all" 
ON public.bills 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_bills_updated_at
BEFORE UPDATE ON public.bills
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();