-- Abuse guards: cap how fast a user can create orders and submit ratings.

create or replace function public.check_order_rate()
returns trigger language plpgsql security definer set search_path = public as $$
declare recent integer;
begin
  select count(*) into recent from public.orders
  where buyer_id = new.buyer_id and created_at > timezone('utc'::text, now()) - interval '1 minute';
  if recent >= 10 then
    raise exception 'Too many orders in a short time. Please wait a moment.';
  end if;
  return new;
end;
$$;
drop trigger if exists orders_rate_limit on public.orders;
create trigger orders_rate_limit before insert on public.orders
for each row execute function public.check_order_rate();

create or replace function public.check_rating_rate()
returns trigger language plpgsql security definer set search_path = public as $$
declare recent integer;
begin
  select count(*) into recent from public.vendor_ratings
  where buyer_id = new.buyer_id and created_at > timezone('utc'::text, now()) - interval '1 minute';
  if recent >= 15 then
    raise exception 'Too many ratings in a short time. Please slow down.';
  end if;
  return new;
end;
$$;
drop trigger if exists ratings_rate_limit on public.vendor_ratings;
create trigger ratings_rate_limit before insert on public.vendor_ratings
for each row execute function public.check_rating_rate();
