
-- Fix: Remove conflicting policies and create a properly restricted UPDATE policy

-- Drop ALL existing UPDATE policies on profiles to start fresh
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile non-license fields" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Drop the trigger as we'll use a WITH CHECK policy instead
DROP TRIGGER IF EXISTS enforce_profile_update_restrictions ON public.profiles;
DROP FUNCTION IF EXISTS public.check_profile_update_allowed();

-- Create a single, properly restricted UPDATE policy
-- Users can only update their own profile, and license fields must remain unchanged
CREATE POLICY "Users can update own profile (restricted)"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (
        user_id = auth.uid() AND
        license_type IS NOT DISTINCT FROM (SELECT p.license_type FROM public.profiles p WHERE p.id = profiles.id) AND
        license_end_date IS NOT DISTINCT FROM (SELECT p.license_end_date FROM public.profiles p WHERE p.id = profiles.id) AND
        license_start_date IS NOT DISTINCT FROM (SELECT p.license_start_date FROM public.profiles p WHERE p.id = profiles.id) AND
        max_products IS NOT DISTINCT FROM (SELECT p.max_products FROM public.profiles p WHERE p.id = profiles.id) AND
        max_bills_per_month IS NOT DISTINCT FROM (SELECT p.max_bills_per_month FROM public.profiles p WHERE p.id = profiles.id)
    );
