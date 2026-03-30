alter table public.profiles
add column if not exists avatar_url text,
add column if not exists logo_url text;

insert into storage.buckets (id, name, public)
values ('profile-assets', 'profile-assets', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can view profile assets" on storage.objects;
create policy "Public can view profile assets"
on storage.objects
for select
using (bucket_id = 'profile-assets');

drop policy if exists "Users can upload their own profile assets" on storage.objects;
create policy "Users can upload their own profile assets"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can update their own profile assets" on storage.objects;
create policy "Users can update their own profile assets"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'profile-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can delete their own profile assets" on storage.objects;
create policy "Users can delete their own profile assets"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
);
