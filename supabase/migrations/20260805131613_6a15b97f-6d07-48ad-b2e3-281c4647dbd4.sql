-- Ensure RLS is on and enforced
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Revoke every write privilege from client-facing roles
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.subscriptions FROM authenticated;
REVOKE ALL ON public.subscriptions FROM anon;

-- Owner-only read access for signed-in users
GRANT SELECT ON public.subscriptions TO authenticated;

-- Trusted backend (service role / webhooks) retains full access
GRANT ALL ON public.subscriptions TO service_role;

-- Make the intended policy explicit: exactly one SELECT policy, owner scoped
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.subscriptions IS 'Billing subscriptions. Read-only for the owning user via RLS. All inserts/updates/deletes happen exclusively through the service role (Lemon Squeezy webhook handler); no client write privileges or write policies exist by design.';