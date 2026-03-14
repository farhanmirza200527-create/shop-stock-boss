
-- Fix: Remove the user UPDATE policy entirely and use INSERT/SELECT only
-- Users should only be able to update through a specific edge function or RPC

-- Drop the trigger (scanner doesn't recognize it)
DROP TRIGGER IF EXISTS enforce_license_field_protection ON public.profiles;
DROP FUNCTION IF EXISTS public.check_profile_license_fields();

-- Drop the user update policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Keep only the service_role policy for updates
-- Users can still select their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Create an RPC function for users to safely update only allowed fields
CREATE OR REPLACE FUNCTION public.update_user_profile(
    p_shop_name TEXT DEFAULT NULL,
    p_address TEXT DEFAULT NULL,
    p_address_text TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL,
    p_state TEXT DEFAULT NULL,
    p_phone_number TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_latitude FLOAT DEFAULT NULL,
    p_longitude FLOAT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.profiles
    SET
        shop_name = COALESCE(p_shop_name, shop_name),
        address = COALESCE(p_address, address),
        address_text = COALESCE(p_address_text, address_text),
        city = COALESCE(p_city, city),
        state = COALESCE(p_state, state),
        phone_number = COALESCE(p_phone_number, phone_number),
        email = COALESCE(p_email, email),
        latitude = COALESCE(p_latitude, latitude),
        longitude = COALESCE(p_longitude, longitude),
        updated_at = NOW()
    WHERE user_id = auth.uid();
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_user_profile TO authenticated;
