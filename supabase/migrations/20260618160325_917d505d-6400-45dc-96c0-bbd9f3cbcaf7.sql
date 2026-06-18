ALTER TABLE public.analysis_results ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.chat_messages    ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.cohorts          ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.datasets         ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.pipeline_runs    ADD COLUMN IF NOT EXISTS user_id uuid;

DROP POLICY IF EXISTS "Allow all access to analysis_results" ON public.analysis_results;
DROP POLICY IF EXISTS "Allow all access to chat_messages"    ON public.chat_messages;
DROP POLICY IF EXISTS "Allow all access to cohorts"          ON public.cohorts;
DROP POLICY IF EXISTS "Allow all access to datasets"         ON public.datasets;
DROP POLICY IF EXISTS "Allow all access to pipeline_runs"    ON public.pipeline_runs;

REVOKE ALL ON public.analysis_results FROM anon;
REVOKE ALL ON public.chat_messages    FROM anon;
REVOKE ALL ON public.cohorts          FROM anon;
REVOKE ALL ON public.datasets         FROM anon;
REVOKE ALL ON public.pipeline_runs    FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.analysis_results TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cohorts          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.datasets         TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_runs    TO authenticated;
GRANT ALL ON public.analysis_results TO service_role;
GRANT ALL ON public.chat_messages    TO service_role;
GRANT ALL ON public.cohorts          TO service_role;
GRANT ALL ON public.datasets         TO service_role;
GRANT ALL ON public.pipeline_runs    TO service_role;

CREATE POLICY "Authenticated read analysis_results" ON public.analysis_results FOR SELECT TO authenticated USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Authenticated insert analysis_results" ON public.analysis_results FOR INSERT TO authenticated WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Authenticated update analysis_results" ON public.analysis_results FOR UPDATE TO authenticated USING (user_id IS NULL OR user_id = auth.uid()) WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Authenticated delete analysis_results" ON public.analysis_results FOR DELETE TO authenticated USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Authenticated read chat_messages" ON public.chat_messages FOR SELECT TO authenticated USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Authenticated insert chat_messages" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Authenticated update chat_messages" ON public.chat_messages FOR UPDATE TO authenticated USING (user_id IS NULL OR user_id = auth.uid()) WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Authenticated delete chat_messages" ON public.chat_messages FOR DELETE TO authenticated USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Authenticated read cohorts" ON public.cohorts FOR SELECT TO authenticated USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Authenticated insert cohorts" ON public.cohorts FOR INSERT TO authenticated WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Authenticated update cohorts" ON public.cohorts FOR UPDATE TO authenticated USING (user_id IS NULL OR user_id = auth.uid()) WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Authenticated delete cohorts" ON public.cohorts FOR DELETE TO authenticated USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Authenticated read datasets" ON public.datasets FOR SELECT TO authenticated USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Authenticated insert datasets" ON public.datasets FOR INSERT TO authenticated WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Authenticated update datasets" ON public.datasets FOR UPDATE TO authenticated USING (user_id IS NULL OR user_id = auth.uid()) WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Authenticated delete datasets" ON public.datasets FOR DELETE TO authenticated USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Authenticated read pipeline_runs" ON public.pipeline_runs FOR SELECT TO authenticated USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Authenticated insert pipeline_runs" ON public.pipeline_runs FOR INSERT TO authenticated WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Authenticated update pipeline_runs" ON public.pipeline_runs FOR UPDATE TO authenticated USING (user_id IS NULL OR user_id = auth.uid()) WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Authenticated delete pipeline_runs" ON public.pipeline_runs FOR DELETE TO authenticated USING (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can read cohort uploads" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload cohort files" ON storage.objects;

CREATE POLICY "Auth read own cohort uploads" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'cohort-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Auth upload own cohort uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'cohort-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Auth update own cohort uploads" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'cohort-uploads' AND auth.uid()::text = (storage.foldername(name))[1]) WITH CHECK (bucket_id = 'cohort-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Auth delete own cohort uploads" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'cohort-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
