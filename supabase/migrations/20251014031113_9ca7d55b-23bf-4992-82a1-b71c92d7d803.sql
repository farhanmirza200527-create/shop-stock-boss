-- Create repairs table for managing mobile repair jobs
CREATE TABLE public.repairs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  device_model TEXT NOT NULL,
  problem_description TEXT NOT NULL,
  parts_used TEXT,
  estimated_cost NUMERIC NOT NULL DEFAULT 0,
  final_cost NUMERIC NOT NULL DEFAULT 0,
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,
  delivery_date DATE,
  repair_status TEXT NOT NULL DEFAULT 'Received' CHECK (repair_status IN ('Received', 'In Progress', 'Completed', 'Delivered')),
  warranty_available BOOLEAN NOT NULL DEFAULT false,
  warranty_period TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.repairs ENABLE ROW LEVEL SECURITY;

-- Create policies for full access
CREATE POLICY "Enable read access for all" ON public.repairs FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all" ON public.repairs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all" ON public.repairs FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all" ON public.repairs FOR DELETE USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_repairs_updated_at
  BEFORE UPDATE ON public.repairs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();