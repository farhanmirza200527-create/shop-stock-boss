-- =============================================
-- SECURITY FIX: Replace permissive RLS policies with authenticated-only access
-- =============================================

-- PRODUCTS TABLE: Drop permissive policies and add authenticated-only policies
DROP POLICY IF EXISTS "Enable delete access for all" ON public.products;
DROP POLICY IF EXISTS "Enable insert access for all" ON public.products;
DROP POLICY IF EXISTS "Enable update access for all" ON public.products;
DROP POLICY IF EXISTS "Enable read access for all" ON public.products;

CREATE POLICY "Authenticated users can read products"
ON public.products FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert products"
ON public.products FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update products"
ON public.products FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete products"
ON public.products FOR DELETE
USING (auth.role() = 'authenticated');

-- REPAIRS TABLE: Drop permissive policies and add authenticated-only policies
DROP POLICY IF EXISTS "Enable delete access for all" ON public.repairs;
DROP POLICY IF EXISTS "Enable insert access for all" ON public.repairs;
DROP POLICY IF EXISTS "Enable update access for all" ON public.repairs;
DROP POLICY IF EXISTS "Enable read access for all" ON public.repairs;

CREATE POLICY "Authenticated users can read repairs"
ON public.repairs FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert repairs"
ON public.repairs FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update repairs"
ON public.repairs FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete repairs"
ON public.repairs FOR DELETE
USING (auth.role() = 'authenticated');

-- BILLS TABLE: Drop permissive policies and add authenticated-only policies
DROP POLICY IF EXISTS "Enable delete access for all" ON public.bills;
DROP POLICY IF EXISTS "Enable insert access for all" ON public.bills;
DROP POLICY IF EXISTS "Enable update access for all" ON public.bills;
DROP POLICY IF EXISTS "Enable read access for all" ON public.bills;

CREATE POLICY "Authenticated users can read bills"
ON public.bills FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert bills"
ON public.bills FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update bills"
ON public.bills FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete bills"
ON public.bills FOR DELETE
USING (auth.role() = 'authenticated');

-- =============================================
-- STORAGE: Fix product-images bucket policies
-- =============================================

-- Drop existing permissive storage policies
DROP POLICY IF EXISTS "Public insert access for product images" ON storage.objects;
DROP POLICY IF EXISTS "Public update access for product images" ON storage.objects;
DROP POLICY IF EXISTS "Public delete access for product images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access for product images" ON storage.objects;

-- Keep public read access for product images (needed for displaying products)
CREATE POLICY "Public read access for product-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Restrict write operations to authenticated users only
CREATE POLICY "Authenticated users can upload to product-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update product-images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete from product-images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- =============================================
-- INPUT VALIDATION: Add database constraints
-- =============================================

-- Products table constraints
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS price_non_negative;
ALTER TABLE public.products ADD CONSTRAINT price_non_negative CHECK (price >= 0);

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS quantity_non_negative;
ALTER TABLE public.products ADD CONSTRAINT quantity_non_negative CHECK (quantity >= 0);

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS product_name_length;
ALTER TABLE public.products ADD CONSTRAINT product_name_length CHECK (length(product_name) <= 200);

-- Bills table constraints
ALTER TABLE public.bills DROP CONSTRAINT IF EXISTS amounts_non_negative;
ALTER TABLE public.bills ADD CONSTRAINT amounts_non_negative CHECK (total_amount >= 0 AND paid_amount >= 0);

-- Repairs table constraints
ALTER TABLE public.repairs DROP CONSTRAINT IF EXISTS costs_non_negative;
ALTER TABLE public.repairs ADD CONSTRAINT costs_non_negative CHECK (estimated_cost >= 0 AND final_cost >= 0);

ALTER TABLE public.repairs DROP CONSTRAINT IF EXISTS customer_name_length;
ALTER TABLE public.repairs ADD CONSTRAINT customer_name_length CHECK (length(customer_name) <= 100);

ALTER TABLE public.repairs DROP CONSTRAINT IF EXISTS problem_desc_length;
ALTER TABLE public.repairs ADD CONSTRAINT problem_desc_length CHECK (length(problem_description) <= 2000);