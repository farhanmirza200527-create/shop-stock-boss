
-- Fix privilege escalation: Prevent users from modifying their own license/subscription fields

-- First, drop the existing permissive UPDATE policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create a security definer function to check if a user is trying to modify restricted fields
CREATE OR REPLACE FUNCTION public.check_profile_update_allowed()
RETURNS TRIGGER AS $$
DECLARE
    is_service_role boolean;
BEGIN
    -- Check if the caller is the service role (edge functions)
    -- In Supabase, the service role key bypasses RLS, so if we're here with RLS,
    -- it's an authenticated user trying to update their own profile
    
    -- Prevent updates to license-related fields by authenticated users
    IF OLD.license_type IS DISTINCT FROM NEW.license_type OR
       OLD.license_end_date IS DISTINCT FROM NEW.license_end_date OR
       OLD.license_start_date IS DISTINCT FROM NEW.license_start_date OR
       OLD.max_products IS DISTINCT FROM NEW.max_products OR
       OLD.max_bills_per_month IS DISTINCT FROM NEW.max_bills_per_month THEN
        RAISE EXCEPTION 'Permission denied: License and subscription fields can only be modified by administrators';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the before-update trigger to enforce the restriction
DROP TRIGGER IF EXISTS enforce_profile_update_restrictions ON public.profiles;
CREATE TRIGGER enforce_profile_update_restrictions
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.check_profile_update_allowed();

-- Create a new, more restrictive UPDATE policy
CREATE POLICY "Users can update their own profile non-license fields"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Add a policy for service role (edge functions) to update all fields
CREATE POLICY "Service role can update all profile fields"
    ON public.profiles
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
