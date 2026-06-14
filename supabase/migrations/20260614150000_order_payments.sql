-- Payment fields on orders (Flutterwave). Verification happens server-side in the
-- verify-payment edge function, which is the only thing that flips an order to 'paid'.
alter table public.orders add column if not exists payment_status text not null default 'unpaid'
  check (payment_status in ('unpaid', 'paid', 'failed'));
alter table public.orders add column if not exists payment_ref text;   -- tx_ref sent to Flutterwave
alter table public.orders add column if not exists flw_tx_id text;     -- Flutterwave transaction id
alter table public.orders add column if not exists paid_at timestamptz;

create index if not exists orders_payment_status_idx on public.orders (payment_status);
