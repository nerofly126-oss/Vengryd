-- Orders: buyers check out a cart into an order; sellers track the line items
-- that belong to their products.

create table if not exists public.orders (
  id text primary key default gen_random_uuid()::text,
  buyer_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'cancelled')),
  total numeric(12, 2) not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists orders_buyer_idx on public.orders (buyer_id);

create table if not exists public.order_items (
  id text primary key default gen_random_uuid()::text,
  order_id text not null references public.orders (id) on delete cascade,
  product_id text references public.products (id) on delete set null,
  seller_id uuid references auth.users (id) on delete set null,
  name text not null default '',
  unit_price numeric(12, 2) not null default 0,
  quantity integer not null default 1 check (quantity > 0),
  fulfilled boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists order_items_seller_idx on public.order_items (seller_id);

-- Snapshot seller_id, name and price from the product at insert time
-- (so the client can't spoof price/seller, and history is preserved if the product changes).
create or replace function public.set_order_item_details()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select p.seller_id, p.name, p.price
    into new.seller_id, new.name, new.unit_price
  from public.products p
  where p.id = new.product_id;
  return new;
end;
$$;

drop trigger if exists order_items_set_details on public.order_items;
create trigger order_items_set_details
before insert on public.order_items
for each row execute function public.set_order_item_details();

-- Keep orders.total in sync with its items.
create or replace function public.recompute_order_total()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  oid text := coalesce(new.order_id, old.order_id);
begin
  update public.orders
  set total = coalesce((select sum(unit_price * quantity) from public.order_items where order_id = oid), 0)
  where id = oid;
  return null;
end;
$$;

drop trigger if exists order_items_recompute_total on public.order_items;
create trigger order_items_recompute_total
after insert or update or delete on public.order_items
for each row execute function public.recompute_order_total();

-- ---------------- RLS ----------------
-- Cross-table checks go through SECURITY DEFINER helpers so the orders and
-- order_items policies don't reference each other's RLS (which would recurse).
create or replace function public.uid_owns_order(p_order_id text)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.orders o where o.id = p_order_id and o.buyer_id = auth.uid());
$$;

create or replace function public.uid_sells_in_order(p_order_id text)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.order_items oi where oi.order_id = p_order_id and oi.seller_id = auth.uid());
$$;

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- A buyer sees their own orders; a seller sees orders that contain their items.
drop policy if exists "Read own or selling orders" on public.orders;
create policy "Read own or selling orders" on public.orders for select to authenticated
using (auth.uid() = buyer_id or public.uid_sells_in_order(id));

drop policy if exists "Buyers create orders" on public.orders;
create policy "Buyers create orders" on public.orders for insert to authenticated
with check (auth.uid() = buyer_id);

drop policy if exists "Buyers update own orders" on public.orders;
create policy "Buyers update own orders" on public.orders for update to authenticated
using (auth.uid() = buyer_id) with check (auth.uid() = buyer_id);

-- Items: visible to the order's buyer and to the selling vendor.
drop policy if exists "Read own or selling items" on public.order_items;
create policy "Read own or selling items" on public.order_items for select to authenticated
using (auth.uid() = seller_id or public.uid_owns_order(order_id));

drop policy if exists "Buyers add items to own order" on public.order_items;
create policy "Buyers add items to own order" on public.order_items for insert to authenticated
with check (public.uid_owns_order(order_id));

-- Sellers mark their own line items fulfilled.
drop policy if exists "Sellers update own items" on public.order_items;
create policy "Sellers update own items" on public.order_items for update to authenticated
using (auth.uid() = seller_id) with check (auth.uid() = seller_id);
