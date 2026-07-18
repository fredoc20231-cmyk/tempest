
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['analysis_results','chat_messages','cohorts','datasets','pipeline_runs']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated read %s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated insert %s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated update %s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated delete %s" ON public.%I', t, t);

    EXECUTE format('CREATE POLICY "Owner read %s" ON public.%I FOR SELECT TO authenticated USING (user_id = auth.uid())', t, t);
    EXECUTE format('CREATE POLICY "Owner insert %s" ON public.%I FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())', t, t);
    EXECUTE format('CREATE POLICY "Owner update %s" ON public.%I FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())', t, t);
    EXECUTE format('CREATE POLICY "Owner delete %s" ON public.%I FOR DELETE TO authenticated USING (user_id = auth.uid())', t, t);
  END LOOP;
END $$;
