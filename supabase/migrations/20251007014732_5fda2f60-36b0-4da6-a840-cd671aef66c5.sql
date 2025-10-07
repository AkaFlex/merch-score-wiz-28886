-- Create storage bucket for slide images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'slide-images',
  'slide-images',
  true,
  10485760, -- 10MB limit
  array['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
);

-- Create RLS policies for slide images bucket
create policy "Public Access for slide images"
on storage.objects for select
using (bucket_id = 'slide-images');

create policy "Authenticated users can upload slide images"
on storage.objects for insert
with check (bucket_id = 'slide-images' and auth.role() = 'authenticated');

create policy "Service role can delete slide images"
on storage.objects for delete
using (bucket_id = 'slide-images' and auth.role() = 'service_role');