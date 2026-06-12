-- Seller write access + image storage.
-- Buyers still read everything (public read from the catalog migration); now a
-- signed-in seller can create/edit/delete THEIR OWN products and vendor profile,
-- and upload product/profile images. Buyer dashboard reads the same tables, so
-- anything a seller saves syncs to buyers automatically.

-- ---------------- Ownership columns ----------------
alter table public.products add column if not exists seller_id uuid references auth.users (id) on delete cascade;
alter table public.vendors  add column if not exists seller_id uuid references auth.users (id) on delete cascade;

create index if not exists products_seller_idx on public.products (seller_id);
-- one vendor/storefront profile per seller
create unique index if not exists vendors_seller_unique on public.vendors (seller_id) where seller_id is not null;

-- ---------------- Write RLS for products ----------------
drop policy if exists "Sellers insert own products" on public.products;
create policy "Sellers insert own products"
on public.products for insert to authenticated
with check (auth.uid() = seller_id);

drop policy if exists "Sellers update own products" on public.products;
create policy "Sellers update own products"
on public.products for update to authenticated
using (auth.uid() = seller_id) with check (auth.uid() = seller_id);

drop policy if exists "Sellers delete own products" on public.products;
create policy "Sellers delete own products"
on public.products for delete to authenticated
using (auth.uid() = seller_id);

-- ---------------- Write RLS for vendors ----------------
drop policy if exists "Sellers insert own vendor" on public.vendors;
create policy "Sellers insert own vendor"
on public.vendors for insert to authenticated
with check (auth.uid() = seller_id);

drop policy if exists "Sellers update own vendor" on public.vendors;
create policy "Sellers update own vendor"
on public.vendors for update to authenticated
using (auth.uid() = seller_id) with check (auth.uid() = seller_id);

drop policy if exists "Sellers delete own vendor" on public.vendors;
create policy "Sellers delete own vendor"
on public.vendors for delete to authenticated
using (auth.uid() = seller_id);

-- ---------------- Storage: public-read bucket for catalog/profile images ----------------
insert into storage.buckets (id, name, public)
values ('catalog-images', 'catalog-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public read catalog images" on storage.objects;
create policy "Public read catalog images"
on storage.objects for select
using (bucket_id = 'catalog-images');

drop policy if exists "Sellers upload own catalog images" on storage.objects;
create policy "Sellers upload own catalog images"
on storage.objects for insert to authenticated
with check (bucket_id = 'catalog-images' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Sellers update own catalog images" on storage.objects;
create policy "Sellers update own catalog images"
on storage.objects for update to authenticated
using (bucket_id = 'catalog-images' and auth.uid()::text = (storage.foldername(name))[1])
with check (bucket_id = 'catalog-images' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Sellers delete own catalog images" on storage.objects;
create policy "Sellers delete own catalog images"
on storage.objects for delete to authenticated
using (bucket_id = 'catalog-images' and auth.uid()::text = (storage.foldername(name))[1]);
