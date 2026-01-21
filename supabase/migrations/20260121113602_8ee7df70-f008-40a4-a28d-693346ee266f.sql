-- Add user_id column to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to bills table
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to repairs table
ALTER TABLE public.repairs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create profiles table for user data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies on products
DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can read products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;

-- Create user-scoped RLS policies for products
CREATE POLICY "Users can read own products" ON public.products
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own products" ON public.products
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own products" ON public.products
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own products" ON public.products
  FOR DELETE USING (user_id = auth.uid());

-- Drop existing RLS policies on bills
DROP POLICY IF EXISTS "Authenticated users can delete bills" ON public.bills;
DROP POLICY IF EXISTS "Authenticated users can insert bills" ON public.bills;
DROP POLICY IF EXISTS "Authenticated users can read bills" ON public.bills;
DROP POLICY IF EXISTS "Authenticated users can update bills" ON public.bills;

-- Create user-scoped RLS policies for bills
CREATE POLICY "Users can read own bills" ON public.bills
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own bills" ON public.bills
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own bills" ON public.bills
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own bills" ON public.bills
  FOR DELETE USING (user_id = auth.uid());

-- Drop existing RLS policies on repairs
DROP POLICY IF EXISTS "Authenticated users can delete repairs" ON public.repairs;
DROP POLICY IF EXISTS "Authenticated users can insert repairs" ON public.repairs;
DROP POLICY IF EXISTS "Authenticated users can read repairs" ON public.repairs;
DROP POLICY IF EXISTS "Authenticated users can update repairs" ON public.repairs;

-- Create user-scoped RLS policies for repairs
CREATE POLICY "Users can read own repairs" ON public.repairs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own repairs" ON public.repairs
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own repairs" ON public.repairs
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own repairs" ON public.repairs
  FOR DELETE USING (user_id = auth.uid());

-- Create RLS policies for profiles
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, shop_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'shop_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add trigger for updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();