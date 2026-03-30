create extension if not exists pgcrypto;

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('buyer', 'seller')),
  full_name text,
  business_name text,
  username text,
  location text default 'Lagos',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists profiles_username_unique
on public.profiles (lower(username))
where username is not null;

create table if not exists public.seller_payment_settings (
  seller_id uuid primary key references public.profiles (id) on delete cascade,
  plan text not null default 'Free' check (plan in ('Free', 'Pro')),
  verification_status text not null default 'Unverified' check (verification_status in ('Unverified', 'Verified')),
  enabled_methods text[] not null default '{}'::text[],
  bank_name text not null default '',
  account_name text not null default '',
  account_number text not null default '',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.products (
  id text primary key default gen_random_uuid()::text,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  price numeric(12,2) not null default 0,
  category text not null,
  location text default 'Lagos',
  stock integer not null default 0,
  sales integer not null default 0,
  views integer not null default 0,
  status text not null default 'Draft' check (status in ('Active', 'Draft', 'Out of Stock')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists products_seller_id_idx on public.products (seller_id);
create index if not exists products_status_idx on public.products (status);

create table if not exists public.orders (
  id text primary key default gen_random_uuid()::text,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid references public.profiles (id) on delete set null,
  product_id text references public.products (id) on delete set null,
  item_name text not null,
  seller_name text not null,
  status text not null default 'Processing' check (status in ('Processing', 'Shipped', 'Delivered', 'Cancelled')),
  amount numeric(12,2) not null default 0,
  tracking text,
  ordered_at timestamptz not null default timezone('utc'::text, now()),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists orders_buyer_id_idx on public.orders (buyer_id);
create index if not exists orders_seller_id_idx on public.orders (seller_id);

create table if not exists public.wishlist_items (
  id text primary key default gen_random_uuid()::text,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  product_id text references public.products (id) on delete set null,
  product_name text not null,
  seller_name text not null,
  price numeric(12,2) not null default 0,
  category text not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists wishlist_items_buyer_id_idx on public.wishlist_items (buyer_id);

create table if not exists public.buyer_activity_log (
  id text primary key default gen_random_uuid()::text,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  action text not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists buyer_activity_log_buyer_id_idx on public.buyer_activity_log (buyer_id);

create table if not exists public.seller_activity_log (
  id text primary key default gen_random_uuid()::text,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  action text not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists seller_activity_log_seller_id_idx on public.seller_activity_log (seller_id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists seller_payment_settings_set_updated_at on public.seller_payment_settings;
create trigger seller_payment_settings_set_updated_at
before update on public.seller_payment_settings
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists wishlist_items_set_updated_at on public.wishlist_items;
create trigger wishlist_items_set_updated_at
before update on public.wishlist_items
for each row
execute function public.set_current_timestamp_updated_at();

alter table public.profiles enable row level security;
alter table public.seller_payment_settings enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.buyer_activity_log enable row level security;
alter table public.seller_activity_log enable row level security;

drop policy if exists "Authenticated users can read seller-facing profiles" on public.profiles;
create policy "Authenticated users can read seller-facing profiles"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Sellers can view their own payment settings" on public.seller_payment_settings;
create policy "Sellers can view their own payment settings"
on public.seller_payment_settings
for select
to authenticated
using (auth.uid() = seller_id);

drop policy if exists "Sellers can insert their own payment settings" on public.seller_payment_settings;
create policy "Sellers can insert their own payment settings"
on public.seller_payment_settings
for insert
to authenticated
with check (auth.uid() = seller_id);

drop policy if exists "Sellers can update their own payment settings" on public.seller_payment_settings;
create policy "Sellers can update their own payment settings"
on public.seller_payment_settings
for update
to authenticated
using (auth.uid() = seller_id)
with check (auth.uid() = seller_id);

drop policy if exists "Authenticated users can view products" on public.products;
create policy "Authenticated users can view products"
on public.products
for select
to authenticated
using (true);

drop policy if exists "Sellers can insert their own products" on public.products;
create policy "Sellers can insert their own products"
on public.products
for insert
to authenticated
with check (auth.uid() = seller_id);

drop policy if exists "Sellers can update their own products" on public.products;
create policy "Sellers can update their own products"
on public.products
for update
to authenticated
using (auth.uid() = seller_id)
with check (auth.uid() = seller_id);

drop policy if exists "Sellers can delete their own products" on public.products;
create policy "Sellers can delete their own products"
on public.products
for delete
to authenticated
using (auth.uid() = seller_id);

drop policy if exists "Users can view orders they participate in" on public.orders;
create policy "Users can view orders they participate in"
on public.orders
for select
to authenticated
using (auth.uid() = buyer_id or auth.uid() = seller_id);

drop policy if exists "Buyers can insert their own orders" on public.orders;
create policy "Buyers can insert their own orders"
on public.orders
for insert
to authenticated
with check (auth.uid() = buyer_id);

drop policy if exists "Participants can update their orders" on public.orders;
create policy "Participants can update their orders"
on public.orders
for update
to authenticated
using (auth.uid() = buyer_id or auth.uid() = seller_id)
with check (auth.uid() = buyer_id or auth.uid() = seller_id);

drop policy if exists "Buyers can view their own wishlist" on public.wishlist_items;
create policy "Buyers can view their own wishlist"
on public.wishlist_items
for select
to authenticated
using (auth.uid() = buyer_id);

drop policy if exists "Buyers can insert their own wishlist" on public.wishlist_items;
create policy "Buyers can insert their own wishlist"
on public.wishlist_items
for insert
to authenticated
with check (auth.uid() = buyer_id);

drop policy if exists "Buyers can update their own wishlist" on public.wishlist_items;
create policy "Buyers can update their own wishlist"
on public.wishlist_items
for update
to authenticated
using (auth.uid() = buyer_id)
with check (auth.uid() = buyer_id);

drop policy if exists "Buyers can delete their own wishlist" on public.wishlist_items;
create policy "Buyers can delete their own wishlist"
on public.wishlist_items
for delete
to authenticated
using (auth.uid() = buyer_id);

drop policy if exists "Buyers can view their own activity" on public.buyer_activity_log;
create policy "Buyers can view their own activity"
on public.buyer_activity_log
for select
to authenticated
using (auth.uid() = buyer_id);

drop policy if exists "Buyers can insert their own activity" on public.buyer_activity_log;
create policy "Buyers can insert their own activity"
on public.buyer_activity_log
for insert
to authenticated
with check (auth.uid() = buyer_id);

drop policy if exists "Sellers can view their own activity" on public.seller_activity_log;
create policy "Sellers can view their own activity"
on public.seller_activity_log
for select
to authenticated
using (auth.uid() = seller_id);

drop policy if exists "Sellers can insert their own activity" on public.seller_activity_log;
create policy "Sellers can insert their own activity"
on public.seller_activity_log
for insert
to authenticated
with check (auth.uid() = seller_id);
