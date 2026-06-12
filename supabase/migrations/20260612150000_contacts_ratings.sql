-- Seller contact details, product descriptions, and a real vendor rating system.

-- Vendor contact details
alter table public.vendors add column if not exists phone text;
alter table public.vendors add column if not exists whatsapp text;
alter table public.vendors add column if not exists contact_email text;

-- Product description (for the detail view)
alter table public.products add column if not exists description text;

-- ---------------- Vendor ratings (one per buyer per vendor) ----------------
create table if not exists public.vendor_ratings (
  id text primary key default gen_random_uuid()::text,
  vendor_id text not null references public.vendors (id) on delete cascade,
  buyer_id uuid not null references auth.users (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (vendor_id, buyer_id)
);

create index if not exists vendor_ratings_vendor_idx on public.vendor_ratings (vendor_id);

alter table public.vendor_ratings enable row level security;

drop policy if exists "Public can read vendor ratings" on public.vendor_ratings;
create policy "Public can read vendor ratings" on public.vendor_ratings for select using (true);

drop policy if exists "Buyers insert own rating" on public.vendor_ratings;
create policy "Buyers insert own rating"
on public.vendor_ratings for insert to authenticated
with check (auth.uid() = buyer_id);

drop policy if exists "Buyers update own rating" on public.vendor_ratings;
create policy "Buyers update own rating"
on public.vendor_ratings for update to authenticated
using (auth.uid() = buyer_id) with check (auth.uid() = buyer_id);

drop policy if exists "Buyers delete own rating" on public.vendor_ratings;
create policy "Buyers delete own rating"
on public.vendor_ratings for delete to authenticated
using (auth.uid() = buyer_id);

-- Keep vendors.rating (avg) and vendors.reviews (count) in sync with ratings.
create or replace function public.recompute_vendor_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  vid text := coalesce(new.vendor_id, old.vendor_id);
begin
  update public.vendors v
  set
    rating = coalesce((select round(avg(rating)::numeric, 1) from public.vendor_ratings where vendor_id = vid), 0),
    reviews = (select count(*) from public.vendor_ratings where vendor_id = vid)
  where v.id = vid;
  return null;
end;
$$;

drop trigger if exists vendor_ratings_recompute on public.vendor_ratings;
create trigger vendor_ratings_recompute
after insert or update or delete on public.vendor_ratings
for each row execute function public.recompute_vendor_rating();
