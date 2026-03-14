-- Create a separate private bucket for repair photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('repair-photos', 'repair-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload repair photos to their own folder
CREATE POLICY "Users can upload repair photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'repair-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to read their own repair photos
CREATE POLICY "Users can read own repair photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'repair-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own repair photos
CREATE POLICY "Users can delete own repair photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'repair-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Drop old UPDATE policy on profiles if it still exists (for license bypass fix)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;