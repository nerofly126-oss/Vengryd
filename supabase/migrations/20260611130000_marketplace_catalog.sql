-- Marketplace catalog: products + service vendors, browsable by category.
-- Self-contained: safe to run on a fresh DB, and cleans up the earlier
-- electronics-only seed if that migration was ever applied.

create extension if not exists pgcrypto;

create table if not exists public.categories (
  id text primary key default gen_random_uuid()::text,
  label text not null,
  slug text not null,
  icon text not null default 'package',
  kind text not null default 'product' check (kind in ('product', 'service')),
  sort integer not null default 0,
  product_count integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.categories add column if not exists kind text not null default 'product';

create table if not exists public.products (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  category_id text references public.categories (id) on delete set null,
  icon text not null default 'package',
  tint text not null default 'from-slate-700 to-slate-900',
  image_url text,
  price numeric(12,2) not null default 0,
  old_price numeric(12,2),
  discount integer,
  rating numeric(2,1) not null default 0,
  reviews integer not null default 0,
  sold integer,
  stock integer,
  is_featured boolean not null default false,
  is_hot_deal boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists products_featured_idx on public.products (is_featured);
create index if not exists products_hot_deal_idx on public.products (is_hot_deal);
create index if not exists products_category_idx on public.products (category_id);

create table if not exists public.vendors (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  category_id text references public.categories (id) on delete set null,
  icon text not null default 'package',
  tint text not null default 'from-emerald-700 to-emerald-900',
  image_url text,
  area text,
  rating numeric(2,1) not null default 0,
  reviews integer not null default 0,
  services text[] not null default '{}'::text[],
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists vendors_category_idx on public.vendors (category_id);

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.vendors enable row level security;

-- Storefront is publicly browsable, so allow read to everyone (anon + authenticated).
drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories" on public.categories for select using (true);

drop policy if exists "Public can read products" on public.products;
create policy "Public can read products" on public.products for select using (true);

drop policy if exists "Public can read vendors" on public.vendors;
create policy "Public can read vendors" on public.vendors for select using (true);

-- ---------------- Clean up the earlier electronics-only seed (no-op on a fresh DB) ----------------
delete from public.products where id in ('d1','d2','d3','d4','f1','f2','f3','f4','f5','f6');
delete from public.categories where id in ('c1','c2','c3','c4','c5','c6','c7','c8');

-- ---------------- Seed: categories (mix of product + service) ----------------
insert into public.categories (id, label, slug, icon, kind, sort, product_count) values
  ('gadgets',  'Gadgets & Electronics', 'gadgets-electronics', 'smartphone', 'product', 1, 0),
  ('fashion',  'Fashion & Style',       'fashion-style',       'shirt',      'product', 2, 0),
  ('artisan',  'Artisan & Crafts',      'artisan-crafts',      'gem',        'product', 3, 0),
  ('farm',     'Organic & Farm',        'organic-farm',        'leaf',       'product', 4, 0),
  ('barbers',  'Barbers & Salons',      'barbers-salons',      'scissors',   'service', 5, 0),
  ('stylists', 'Hair Stylists',         'hair-stylists',       'sparkles',   'service', 6, 0),
  ('home',     'Home Services',         'home-services',       'wrench',     'service', 7, 0),
  ('food',     'Food & Catering',       'food-catering',       'utensils',   'service', 8, 0)
on conflict (id) do nothing;

-- ---------------- Seed: products (product categories) ----------------
insert into public.products
  (id, name, category_id, icon, tint, price, old_price, discount, rating, reviews, sold, stock, is_featured, is_hot_deal) values
  ('p1', 'Samsung Galaxy S21 Ultra 128GB — Black', 'gadgets', 'smartphone', 'from-emerald-700 to-emerald-900', 750, 895, 16, 4, 12, 8,  20, true,  true),
  ('p2', 'Apple Watch Series 7 GPS 45MM Midnight', 'gadgets', 'watch',      'from-teal-600 to-emerald-700',    89,  null, null, 4, 9,  4,  30, false, true),
  ('p3', 'Apple iPad Pro M1 11-inch Wi-Fi 128GB',  'gadgets', 'tablet',     'from-emerald-600 to-green-800',   754, 972, 22, 5, 21, 6,  50, true,  true),
  ('p4', 'Sony WH-1000XM5 Headphones',             'gadgets', 'headphones', 'from-green-700 to-teal-800',      299, 349, 14, 5, 33, 12, 40, true,  false),
  ('p5', 'Ankara Two-Piece Set — Handmade',        'fashion', 'shirt',      'from-teal-700 to-emerald-800',    65,  80,  18, 4, 7,  null, 25, true, false),
  ('p6', 'Handwoven Leather Tote Bag',             'artisan', 'gem',        'from-emerald-700 to-green-900',   120, null, null, 5, 4, null, 10, true, false),
  ('p7', 'Cold-Pressed Shea Butter (500g)',        'farm',    'leaf',       'from-green-600 to-emerald-800',   18,  null, null, 4, 15, null, 80, true, false),
  ('p8', 'Beaded Statement Necklace',              'artisan', 'gem',        'from-teal-600 to-green-800',      45,  60,  25, 4, 6, null, 18, true, false)
on conflict (id) do nothing;

-- ---------------- Seed: vendors (service categories) ----------------
insert into public.vendors
  (id, name, category_id, icon, tint, area, rating, reviews, services) values
  ('v1', 'Kola''s Cuts',            'barbers',  'scissors', 'from-emerald-700 to-emerald-900', 'Yaba, Lagos',     5, 128, array['Haircut','Beard trim','Line up']),
  ('v2', 'Crown Barbershop',        'barbers',  'scissors', 'from-teal-700 to-emerald-800',    'Ikeja, Lagos',    4, 86,  array['Fade','Kids cut','Hot towel shave']),
  ('v3', 'Bella Hair Studio',       'stylists', 'sparkles', 'from-emerald-600 to-teal-800',    'Lekki, Lagos',    5, 204, array['Braids','Wig install','Silk press']),
  ('v4', 'Nubian Locs & Naturals',  'stylists', 'sparkles', 'from-green-700 to-emerald-900',   'Surulere, Lagos', 4, 57,  array['Locs retwist','Cornrows','Treatment']),
  ('v5', 'FixIt Home Services',     'home',     'wrench',   'from-teal-600 to-green-800',      'Mainland, Lagos', 4, 73,  array['Plumbing','Electrical','AC repair']),
  ('v6', 'Mama''s Kitchen Catering','food',     'utensils', 'from-green-600 to-emerald-800',   'Victoria Island', 5, 142, array['Jollof','Small chops','Event catering'])
on conflict (id) do nothing;
