-- Vendor payout setup for Flutterwave auto-split.
-- The subaccount id is needed client-side at checkout (to build the split), so it
-- lives on the public vendors row. The sensitive bank details live in a separate
-- owner-only table.

alter table public.vendors add column if not exists flw_subaccount_id text;

create table if not exists public.vendor_payouts (
  vendor_id text primary key references public.vendors (id) on delete cascade,
  seller_id uuid not null references auth.users (id) on delete cascade,
  bank_code text not null,
  account_number text not null,
  account_name text,
  flw_subaccount_id text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.vendor_payouts enable row level security;

-- Only the owning seller can see/manage their own bank details. The edge function
-- writes here with the service role (which bypasses RLS).
drop policy if exists "Owner reads payout" on public.vendor_payouts;
create policy "Owner reads payout" on public.vendor_payouts for select to authenticated
using (auth.uid() = seller_id);

drop policy if exists "Owner inserts payout" on public.vendor_payouts;
create policy "Owner inserts payout" on public.vendor_payouts for insert to authenticated
with check (auth.uid() = seller_id);

drop policy if exists "Owner updates payout" on public.vendor_payouts;
create policy "Owner updates payout" on public.vendor_payouts for update to authenticated
using (auth.uid() = seller_id) with check (auth.uid() = seller_id);
