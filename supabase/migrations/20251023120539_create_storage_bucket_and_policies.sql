-- Create storage bucket for media uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profiles',
  'profiles',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/mov', 'video/avi', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for the profiles bucket
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profiles' 
  AND auth.role() = 'authenticated'
);

-- Allow public read access to files
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'profiles');

-- Allow authenticated users to update their own files
CREATE POLICY "Allow authenticated updates" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profiles' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profiles' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to list files
CREATE POLICY "Allow authenticated list" ON storage.objects
FOR SELECT USING (
  bucket_id = 'profiles' 
  AND auth.role() = 'authenticated'
);
