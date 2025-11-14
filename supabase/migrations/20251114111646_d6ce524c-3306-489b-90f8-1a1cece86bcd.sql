-- Update slide-images bucket to allow files up to 2GB
UPDATE storage.buckets
SET file_size_limit = 2147483648
WHERE id = 'slide-images';