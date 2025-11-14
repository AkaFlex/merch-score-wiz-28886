-- Update slide-images bucket to allow PPTX files
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/gif',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
]
WHERE id = 'slide-images';