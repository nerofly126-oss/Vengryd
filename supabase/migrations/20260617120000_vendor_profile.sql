-- Richer vendor profiles: cover image, bio, tagline, verification, socials, hours.
alter table public.vendors add column if not exists cover_url text;
alter table public.vendors add column if not exists bio text;
alter table public.vendors add column if not exists tagline text;
alter table public.vendors add column if not exists verified boolean not null default false;
alter table public.vendors add column if not exists socials jsonb not null default '{}'::jsonb;
alter table public.vendors add column if not exists hours jsonb not null default '{}'::jsonb;
