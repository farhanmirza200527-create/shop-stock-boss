
-- Fix: Use a trigger-based approach to enforce license field restrictions

-- First drop the problematic policy
DROP POLICY IF EXISTS "Users can update own profile (restricted)" ON public.profiles;

-- Create a simple update policy that only checks ownership
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Create a trigger function that enforces the restriction
CREATE OR REPLACE FUNCTION public.check_profile_license_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Only enforce this for authenticated users (not service role)
    -- Service role bypasses RLS entirely, so if we're here it's an authenticated user
    
    -- Check if any license field is being modified
    IF OLD.license_type IS DISTINCT FROM NEW.license_type THEN
        RAISE EXCEPTION 'Cannot modify license_type field';
    END IF;
    
    IF OLD.license_end_date IS DISTINCT FROM NEW.license_end_date THEN
        RAISE EXCEPTION 'Cannot modify license_end_date field';
    END IF;
    
    IF OLD.license_start_date IS DISTINCT FROM NEW.license_start_date THEN
        RAISE EXCEPTION 'Cannot modify license_start_date field';
    END IF;
    
    IF OLD.max_products IS DISTINCT FROM NEW.max_products THEN
        RAISE EXCEPTION 'Cannot modify max_products field';
    END IF;
    
    IF OLD.max_bills_per_month IS DISTINCT FROM NEW.max_bills_per_month THEN
        RAISE EXCEPTION 'Cannot modify max_bills_per_month field';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger
DROP TRIGGER IF EXISTS enforce_license_field_protection ON public.profiles;
CREATE TRIGGER enforce_license_field_protection
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.check_profile_license_fields();
