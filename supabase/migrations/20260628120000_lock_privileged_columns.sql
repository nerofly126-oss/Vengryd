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
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_lock_fields on public.profiles;
create trigger profiles_lock_fields
before update on public.profiles
for each row execute function public.lock_profile_fields();

-- ---------------- vendors: clients cannot self-verify or reroute payouts --------
-- `verified` is a trust badge; `flw_subaccount_id` decides where checkout money is
-- split to. Both are set server-side only (admin / paystack edge function).
create or replace function public.lock_vendor_fields()
returns trigger language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.verified := old.verified;
    new.flw_subaccount_id := old.flw_subaccount_id;
  end if;
  return new;
end;
$$;

drop trigger if exists vendors_lock_fields on public.vendors;
create trigger vendors_lock_fields
before update on public.vendors
for each row execute function public.lock_vendor_fields();

-- ---------------- orders: clients cannot touch financial / payment fields -------
-- Buyers may still update `status` (e.g. cancel). Everything money- or
-- payment-related is owned by the recompute trigger + the paystack edge function.
create or replace function public.lock_order_fields()
returns trigger language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.buyer_id := old.buyer_id;
    new.total := old.total;
    new.payment_status := old.payment_status;
    new.paid_at := old.paid_at;
    new.flw_tx_id := old.flw_tx_id;
    new.payment_ref := old.payment_ref;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_lock_fields on public.orders;
create trigger orders_lock_fields
before update on public.orders
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

-- ---------------- vendor_ratings: a seller cannot rate their own vendor ---------
drop policy if exists "Buyers insert own rating" on public.vendor_ratings;
create policy "Buyers insert own rating"
on public.vendor_ratings for insert to authenticated
with check (
  auth.uid() = buyer_id
  and exists (
    select 1
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    join public.vendors v on v.id = vendor_id
    where v.seller_id = oi.seller_id
      and o.buyer_id = auth.uid()
      and o.payment_status = 'paid'
      and v.seller_id <> auth.uid()
  )
);
