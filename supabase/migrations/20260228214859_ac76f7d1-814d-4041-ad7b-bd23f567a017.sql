
INSERT INTO storage.buckets (id, name, public) VALUES ('cohort-uploads', 'cohort-uploads', true);

CREATE POLICY "Anyone can read cohort uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'cohort-uploads');

CREATE POLICY "Anyone can upload cohort files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'cohort-uploads');
