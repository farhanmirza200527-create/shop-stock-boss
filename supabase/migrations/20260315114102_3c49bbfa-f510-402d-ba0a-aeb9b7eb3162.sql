
-- Update all RLS policies to use 'authenticated' role instead of 'public'

-- bills
DROP POLICY IF EXISTS "Users can read own bills" ON public.bills;
DROP POLICY IF EXISTS "Users can insert own bills" ON public.bills;
DROP POLICY IF EXISTS "Users can update own bills" ON public.bills;
DROP POLICY IF EXISTS "Users can delete own bills" ON public.bills;
CREATE POLICY "Users can read own bills" ON public.bills FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own bills" ON public.bills FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own bills" ON public.bills FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own bills" ON public.bills FOR DELETE TO authenticated USING (user_id = auth.uid());

-- categories
DROP POLICY IF EXISTS "Users can read own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON public.categories;
CREATE POLICY "Users can read own categories" ON public.categories FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own categories" ON public.categories FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own categories" ON public.categories FOR DELETE TO authenticated USING (user_id = auth.uid());

-- products
DROP POLICY IF EXISTS "Users can read own products" ON public.products;
DROP POLICY IF EXISTS "Users can insert own products" ON public.products;
DROP POLICY IF EXISTS "Users can update own products" ON public.products;
DROP POLICY IF EXISTS "Users can delete own products" ON public.products;
CREATE POLICY "Users can read own products" ON public.products FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own products" ON public.products FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own products" ON public.products FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own products" ON public.products FOR DELETE TO authenticated USING (user_id = auth.uid());

-- repairs
DROP POLICY IF EXISTS "Users can read own repairs" ON public.repairs;
DROP POLICY IF EXISTS "Users can insert own repairs" ON public.repairs;
DROP POLICY IF EXISTS "Users can update own repairs" ON public.repairs;
DROP POLICY IF EXISTS "Users can delete own repairs" ON public.repairs;
CREATE POLICY "Users can read own repairs" ON public.repairs FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own repairs" ON public.repairs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own repairs" ON public.repairs FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own repairs" ON public.repairs FOR DELETE TO authenticated USING (user_id = auth.uid());

-- refunds
DROP POLICY IF EXISTS "Users can read own refunds" ON public.refunds;
DROP POLICY IF EXISTS "Users can insert own refunds" ON public.refunds;
DROP POLICY IF EXISTS "Users can update own refunds" ON public.refunds;
DROP POLICY IF EXISTS "Users can delete own refunds" ON public.refunds;
CREATE POLICY "Users can read own refunds" ON public.refunds FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own refunds" ON public.refunds FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own refunds" ON public.refunds FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own refunds" ON public.refunds FOR DELETE TO authenticated USING (user_id = auth.uid());

-- pending_payments
DROP POLICY IF EXISTS "Users can read own pending payments" ON public.pending_payments;
DROP POLICY IF EXISTS "Users can insert own pending payments" ON public.pending_payments;
DROP POLICY IF EXISTS "Users can update own pending payments" ON public.pending_payments;
DROP POLICY IF EXISTS "Users can delete own pending payments" ON public.pending_payments;
CREATE POLICY "Users can read own pending payments" ON public.pending_payments FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own pending payments" ON public.pending_payments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own pending payments" ON public.pending_payments FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own pending payments" ON public.pending_payments FOR DELETE TO authenticated USING (user_id = auth.uid());

-- pending_payment_history
DROP POLICY IF EXISTS "Users can read own payment history" ON public.pending_payment_history;
DROP POLICY IF EXISTS "Users can insert own payment history" ON public.pending_payment_history;
DROP POLICY IF EXISTS "Users can delete own payment history" ON public.pending_payment_history;
CREATE POLICY "Users can read own payment history" ON public.pending_payment_history FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own payment history" ON public.pending_payment_history FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own payment history" ON public.pending_payment_history FOR DELETE TO authenticated USING (user_id = auth.uid());

-- profiles (drop the duplicate public-role SELECT and the public INSERT)
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
