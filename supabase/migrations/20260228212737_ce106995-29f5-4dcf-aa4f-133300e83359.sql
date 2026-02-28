
-- Pipeline runs table
CREATE TABLE public.pipeline_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle',
  progress INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Analysis results table
CREATE TABLE public.analysis_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module TEXT NOT NULL,
  results JSONB NOT NULL DEFAULT '{}'::jsonb,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  tools JSONB,
  action JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cohorts table
CREATE TABLE public.cohorts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  samples INTEGER NOT NULL DEFAULT 0,
  timepoints JSONB,
  modalities JSONB,
  tensor_shape TEXT,
  latent_factors INTEGER,
  variance_explained TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.pipeline_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (no auth required for this research tool)
CREATE POLICY "Allow all access to pipeline_runs" ON public.pipeline_runs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to analysis_results" ON public.analysis_results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to chat_messages" ON public.chat_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to cohorts" ON public.cohorts FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for pipeline_runs
ALTER PUBLICATION supabase_realtime ADD TABLE public.pipeline_runs;
