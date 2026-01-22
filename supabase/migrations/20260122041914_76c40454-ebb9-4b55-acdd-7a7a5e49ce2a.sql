-- Add license fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS license_type TEXT NOT NULL DEFAULT 'TRIAL',
ADD COLUMN IF NOT EXISTS license_start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS license_end_date TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '7 days'),
ADD COLUMN IF NOT EXISTS max_products INTEGER NOT NULL DEFAULT 50,
ADD COLUMN IF NOT EXISTS max_bills_per_month INTEGER NOT NULL DEFAULT 100;

-- Add constraint for valid license types
ALTER TABLE public.profiles 
ADD CONSTRAINT valid_license_type CHECK (license_type IN ('TRIAL', 'ACTIVE', 'EXPIRED', 'NONE'));

-- Update the handle_new_user function to set default license on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    email, 
    shop_name,
    license_type,
    license_start_date,
    license_end_date,
    max_products,
    max_bills_per_month
  )
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data->>'shop_name',
    'TRIAL',
    now(),
    now() + INTERVAL '7 days',
    50,
    100
  );
  RETURN NEW;
END;
$function$;