
-- Fix: Update the policy to explicitly prevent changes to license fields using WITH CHECK

-- Drop the existing user update policy
DROP POLICY IF EXISTS "Users can update their own profile non-license fields" ON public.profiles;

-- Create a stricter UPDATE policy that prevents changes to license fields
CREATE POLICY "Users can update their own profile non-license fields"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (
        user_id = auth.uid() AND
        license_type = (SELECT license_type FROM public.profiles WHERE id = public.profiles.id) AND
        license_end_date = (SELECT license_end_date FROM public.profiles WHERE id = public.profiles.id) AND
        license_start_date = (SELECT license_start_date FROM public.profiles WHERE id = public.profiles.id) AND
        max_products = (SELECT max_products FROM public.profiles WHERE id = public.profiles.id) AND
        max_bills_per_month = (SELECT max_bills_per_month FROM public.profiles WHERE id = public.profiles.id)
    );
