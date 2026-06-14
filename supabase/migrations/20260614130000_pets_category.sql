-- Add a Pets & Pet Goods category (pet food, accessories, toys, supplies).
insert into public.categories (id, label, slug, icon, kind, sort, product_count)
values ('pets', 'Pets & Pet Goods', 'pets-pet-goods', 'pawprint', 'product', 9, 0)
on conflict (id) do nothing;
