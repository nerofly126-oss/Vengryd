-- Human-readable vendor profile URLs: /vendor/<slug> built from the vendor name.

create or replace function public.slugify(txt text)
returns text language sql immutable as $$
  select trim(both '-' from lower(regexp_replace(coalesce(txt, ''), '[^a-zA-Z0-9]+', '-', 'g')));
$$;

alter table public.vendors add column if not exists slug text;

-- Backfill existing vendors with unique slugs (suffix duplicates -2, -3, ...).
with ranked as (
  select
    id,
    nullif(public.slugify(name), '') as base,
    row_number() over (partition by public.slugify(name) order by created_at) as rn
  from public.vendors
)
update public.vendors v
set slug = case
  when r.base is null then 'vendor-' || substr(v.id, 1, 8)
  when r.rn = 1 then r.base
  else r.base || '-' || r.rn
end
from ranked r
where v.id = r.id and (v.slug is null or v.slug = '');

create unique index if not exists vendors_slug_key on public.vendors (slug);

-- Maintain the slug on insert and whenever the name changes.
create or replace function public.set_vendor_slug()
returns trigger language plpgsql set search_path = public as $$
declare
  base text;
  candidate text;
  n integer := 1;
begin
  if tg_op = 'INSERT' or new.name is distinct from old.name or new.slug is null then
    base := nullif(public.slugify(new.name), '');
    if base is null then base := 'vendor-' || substr(new.id, 1, 8); end if;
    candidate := base;
    while exists (select 1 from public.vendors where slug = candidate and id <> new.id) loop
      n := n + 1;
      candidate := base || '-' || n;
    end loop;
    new.slug := candidate;
  end if;
  return new;
end;
$$;

drop trigger if exists vendors_set_slug on public.vendors;
create trigger vendors_set_slug
before insert or update on public.vendors
for each row execute function public.set_vendor_slug();
