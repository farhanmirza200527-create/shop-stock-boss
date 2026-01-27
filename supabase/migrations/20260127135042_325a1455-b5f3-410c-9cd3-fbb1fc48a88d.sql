-- Add barcode column to products table for scanner support
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS barcode TEXT;