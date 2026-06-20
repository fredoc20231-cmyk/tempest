CREATE TABLE public.sealed_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cohort_label text NOT NULL,
  sealed_payload jsonb NOT NULL,
  sealed_hash text NOT NULL,
  sealed_at timestamptz NOT NULL DEFAULT now(),
  outcome_payload jsonb,
  scored_at timestamptz,
  scoring_result jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sealed_predictions TO authenticated;
GRANT ALL ON public.sealed_predictions TO service_role;

ALTER TABLE public.sealed_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own sealed predictions"
  ON public.sealed_predictions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own sealed predictions"
  ON public.sealed_predictions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own sealed predictions"
  ON public.sealed_predictions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own sealed predictions"
  ON public.sealed_predictions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER sealed_predictions_touch
  BEFORE UPDATE ON public.sealed_predictions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();