-- Setup storage bucket for cleaning photos

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('cleaning-photos', 'cleaning-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Give users access to own folder"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'cleaning-photos');

CREATE POLICY "Allow public read access to cleaning photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'cleaning-photos');

CREATE POLICY "Allow authenticated users to upload cleaning photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'cleaning-photos');

CREATE POLICY "Allow authenticated users to delete their own cleaning photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'cleaning-photos');