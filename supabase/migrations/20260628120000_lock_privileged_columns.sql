-- Lock down privilege- and money-bearing columns that were previously writable by
-- clients through whole-row update policies (using/with check on owner id only).
--
-- Approach: BEFORE UPDATE triggers that pin protected columns back to their OLD
-- value whenever the caller is a client role ('authenticated' / 'anon'). The
-- triggers are INVOKER (not SECURITY DEFINER) so `current_user` reflects the role
-- PostgREST set for the request. Service-role calls (edge functions) and writes
-- coming from our own SECURITY DEFINER triggers (e.g. recompute_order_total,
-- recompute_vendor_rating) run as a privileged role and pass through unchanged.

-- ---------------- profiles: clients cannot change their own role ----------------
-- Without this a buyer could `update profiles set role='seller'` and self-promote.
create or replace function public.lock_profile_fields()
returns trigger language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.role := 'buyer';
    else
      new.role := old.role;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_lock_fields on public.profiles;
create trigger profiles_lock_fields
before insert or update on public.profiles
for each row execute function public.lock_profile_fields();

-- Signup metadata is client-supplied, so new accounts always start as buyers.
-- Seller capability is granted below when a real vendor profile is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1));
  v_user text := nullif(new.raw_user_meta_data ->> 'username', '');
begin
  begin
    insert into public.profiles (id, full_name, username, role)
    values (new.id, v_name, v_user, 'buyer')
    on conflict (id) do nothing;
  exception when unique_violation then
    insert into public.profiles (id, full_name, role)
    values (new.id, v_name, 'buyer')
    on conflict (id) do nothing;
  end;
  return new;
end;
$$;

-- ---------------- vendors: clients cannot self-verify or reroute payouts --------
-- `verified` is a trust badge; `flw_subaccount_id` decides where checkout money is
-- split to. Both are set server-side only (admin / paystack edge function).
create or replace function public.lock_vendor_fields()
returns trigger language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.verified := false;
      new.flw_subaccount_id := null;
    else
      new.verified := old.verified;
      new.flw_subaccount_id := old.flw_subaccount_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists vendors_lock_fields on public.vendors;
create trigger vendors_lock_fields
before insert or update on public.vendors
for each row execute function public.lock_vendor_fields();

-- A saved vendor storefront is the trusted "become seller" action. The same
-- account remains a buyer too; this role is additive capability for seller tools.
create or replace function public.promote_vendor_owner_to_seller()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.seller_id is not null then
    update public.profiles
    set role = 'seller'
    where id = new.seller_id
      and role <> 'seller';
  end if;
  return new;
end;
$$;

drop trigger if exists vendors_promote_owner_to_seller on public.vendors;
create trigger vendors_promote_owner_to_seller
after insert or update of seller_id on public.vendors
for each row execute function public.promote_vendor_owner_to_seller();

update public.profiles p
set role = 'seller'
where role <> 'seller'
  and exists (
    select 1
    from public.vendors v
    where v.seller_id = p.id
  );

-- ---------------- orders: clients cannot touch financial / payment fields -------
-- Buyers may still update `status` (e.g. cancel). Everything money- or
-- payment-related is owned by the recompute trigger + the paystack edge function.
create or replace function public.lock_order_fields()
returns trigger language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.total := 0;
      new.payment_status := 'unpaid';
      new.paid_at := null;
      new.flw_tx_id := null;
      new.payment_ref := null;
    else
      new.buyer_id := old.buyer_id;
      new.total := old.total;
      new.payment_status := old.payment_status;
      new.paid_at := old.paid_at;
      new.flw_tx_id := old.flw_tx_id;
      new.payment_ref := old.payment_ref;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_lock_fields on public.orders;
create trigger orders_lock_fields
before insert or update on public.orders
for each row execute function public.lock_order_fields();

-- ---------------- order_items: cannot be added to an already-paid order ---------
-- Previously a buyer could append items after paying (total recomputes but the
-- captured payment doesn't cover the new items). Restrict inserts to open orders.
create or replace function public.uid_owns_open_order(p_order_id text)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.orders o
    where o.id = p_order_id
      and o.buyer_id = auth.uid()
      and o.payment_status = 'unpaid'
      and o.status = 'pending'
  );
$$;

drop policy if exists "Buyers add items to own order" on public.order_items;
create policy "Buyers add items to own order" on public.order_items for insert to authenticated
with check (public.uid_owns_open_order(order_id));

-- Sellers can toggle fulfilment only; order snapshots and totals are immutable
-- from client roles once the insert trigger has captured product details.
create or replace function public.lock_order_item_fields()
returns trigger language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.order_id := old.order_id;
    new.product_id := old.product_id;
    new.seller_id := old.seller_id;
    new.name := old.name;
    new.unit_price := old.unit_price;
    new.quantity := old.quantity;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

drop trigger if exists order_items_lock_fields on public.order_items;
create trigger order_items_lock_fields
before update on public.order_items
for each row execute function public.lock_order_item_fields();

-- ---------------- vendor_ratings: a seller cannot rate their own vendor ---------
create or replace function public.uid_can_rate_vendor(p_vendor_id text)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    join public.vendors v on v.id = p_vendor_id
    where v.seller_id = oi.seller_id
      and o.buyer_id = auth.uid()
      and o.payment_status = 'paid'
      and v.seller_id <> auth.uid()
  );
$$;

create or replace function public.lock_vendor_rating_fields()
returns trigger language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.vendor_id := old.vendor_id;
    new.buyer_id := old.buyer_id;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

drop trigger if exists vendor_ratings_lock_fields on public.vendor_ratings;
create trigger vendor_ratings_lock_fields
before update on public.vendor_ratings
for each row execute function public.lock_vendor_rating_fields();

drop policy if exists "Buyers insert own rating" on public.vendor_ratings;
create policy "Buyers insert own rating"
on public.vendor_ratings for insert to authenticated
with check (
  auth.uid() = buyer_id
  and public.uid_can_rate_vendor(vendor_id)
);

drop policy if exists "Buyers update own rating" on public.vendor_ratings;
create policy "Buyers update own rating"
on public.vendor_ratings for update to authenticated
using (auth.uid() = buyer_id)
with check (
  auth.uid() = buyer_id
  and public.uid_can_rate_vendor(vendor_id)
);
