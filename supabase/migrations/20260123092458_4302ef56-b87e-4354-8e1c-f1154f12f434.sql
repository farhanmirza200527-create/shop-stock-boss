-- Create categories table for user-defined categories
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'PRODUCT' CHECK (type IN ('PRODUCT', 'SERVICE')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for categories
CREATE POLICY "Users can read own categories"
ON public.categories
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own categories"
ON public.categories
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own categories"
ON public.categories
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own categories"
ON public.categories
FOR DELETE
USING (user_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update products table: make category nullable and add category_id reference
ALTER TABLE public.products 
ADD COLUMN category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
ADD COLUMN item_type TEXT DEFAULT 'PRODUCT' CHECK (item_type IN ('PRODUCT', 'SERVICE'));