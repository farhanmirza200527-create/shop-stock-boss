-- Create products table for inventory management
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  section TEXT,
  part TEXT,
  row_number TEXT,
  column_number TEXT,
  warranty_available BOOLEAN NOT NULL DEFAULT false,
  warranty_period TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policies for full access (no authentication required)
CREATE POLICY "Enable read access for all" 
ON public.products 
FOR SELECT 
USING (true);

CREATE POLICY "Enable insert access for all" 
ON public.products 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Enable update access for all" 
ON public.products 
FOR UPDATE 
USING (true);

CREATE POLICY "Enable delete access for all" 
ON public.products 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for product images
CREATE POLICY "Public read access for product images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-images');

CREATE POLICY "Public insert access for product images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Public update access for product images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'product-images');

CREATE POLICY "Public delete access for product images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'product-images');