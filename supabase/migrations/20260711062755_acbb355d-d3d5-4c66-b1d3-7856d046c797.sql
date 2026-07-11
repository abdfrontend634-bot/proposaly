
CREATE TABLE public.proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled proposal',
  job_description TEXT NOT NULL,
  platform TEXT NOT NULL,
  tone TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposals TO authenticated;
GRANT ALL ON public.proposals TO service_role;

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own proposals" ON public.proposals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX proposals_user_created_idx ON public.proposals(user_id, created_at DESC);

-- Track generations (for free plan quota; separate from saved proposals)
CREATE TABLE public.generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.generations TO authenticated;
GRANT ALL ON public.generations TO service_role;

ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own generations" ON public.generations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own generations" ON public.generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX generations_user_created_idx ON public.generations(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
