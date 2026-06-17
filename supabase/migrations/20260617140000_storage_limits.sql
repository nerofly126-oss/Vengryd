-- Enforce image-only uploads and a 5MB cap at the bucket level (server-side),
-- so the client checks in uploadImage() can't be bypassed via the storage API.
update storage.buckets
set
  file_size_limit = 5242880, -- 5 MB
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
where id = 'catalog-images';
