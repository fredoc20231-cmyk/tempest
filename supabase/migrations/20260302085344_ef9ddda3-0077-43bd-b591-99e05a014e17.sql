
-- Table to store datasets fetched from public sources (TCGA, cBioPortal, etc.)
CREATE TABLE public.datasets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  source TEXT NOT NULL, -- e.g. 'tcga', 'cbioportal', 'uniprot', 'cosmic', 'manual'
  source_id TEXT, -- external identifier (e.g. TCGA project ID)
  category TEXT NOT NULL DEFAULT 'genomic', -- genomic, expression, clinical, mutation, neoantigen
  description TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  record_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb, -- source URL, query params, etc.
  is_training BOOLEAN NOT NULL DEFAULT false, -- flagged for model enrichment
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to datasets"
ON public.datasets FOR ALL
USING (true)
WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX idx_datasets_source ON public.datasets(source);
CREATE INDEX idx_datasets_category ON public.datasets(category);
CREATE INDEX idx_datasets_is_training ON public.datasets(is_training);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.datasets;
