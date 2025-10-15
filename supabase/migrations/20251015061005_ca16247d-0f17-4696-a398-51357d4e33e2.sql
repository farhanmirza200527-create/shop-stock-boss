-- Add soft delete support to products table
ALTER TABLE public.products 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add index for better query performance on non-deleted products
CREATE INDEX idx_products_deleted_at ON public.products(deleted_at) WHERE deleted_at IS NULL;

-- Add category column to products for filtering
ALTER TABLE public.products 
ADD COLUMN category TEXT DEFAULT 'Other';

COMMENT ON COLUMN public.products.deleted_at IS 'Timestamp when product was soft deleted. NULL means product is active.';
COMMENT ON COLUMN public.products.category IS 'Product category: Cables, Covers, Chargers, Earbuds, Screen Guards, Other';