-- Precise vendor location (GPS coordinates) for distance-based "near you" ranking.
alter table public.vendors add column if not exists lat double precision;
alter table public.vendors add column if not exists lng double precision;
