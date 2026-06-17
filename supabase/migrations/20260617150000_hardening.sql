-- (8) Data integrity: non-negative money/stock, sane discount, positive order total.
alter table public.products drop constraint if exists products_price_nonneg;
alter table public.products add constraint products_price_nonneg check (price >= 0);

alter table public.products drop constraint if exists products_oldprice_nonneg;
alter table public.products add constraint products_oldprice_nonneg check (old_price is null or old_price >= 0);

alter table public.products drop constraint if exists products_stock_nonneg;
alter table public.products add constraint products_stock_nonneg check (stock is null or stock >= 0);

alter table public.products drop constraint if exists products_discount_range;
alter table public.products add constraint products_discount_range check (discount is null or (discount >= 0 and discount <= 100));

alter table public.orders drop constraint if exists orders_total_nonneg;
alter table public.orders add constraint orders_total_nonneg check (total >= 0);

-- (9) Only buyers who actually paid for an order from this vendor can rate it.
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
  )
);
