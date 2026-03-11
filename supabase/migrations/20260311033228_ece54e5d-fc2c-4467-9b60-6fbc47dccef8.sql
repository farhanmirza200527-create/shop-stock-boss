
CREATE TABLE public.payment_qr_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  label TEXT NOT NULL DEFAULT 'My QR Code',
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_qr_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own QR codes" ON public.payment_qr_codes FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own QR codes" ON public.payment_qr_codes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own QR codes" ON public.payment_qr_codes FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own QR codes" ON public.payment_qr_codes FOR UPDATE TO authenticated USING (user_id = auth.uid());
