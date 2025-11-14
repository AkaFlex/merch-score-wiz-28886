-- Update slide-images bucket to allow larger file sizes (up to 50MB)
UPDATE storage.buckets
SET file_size_limit = 52428800
WHERE id = 'slide-images';