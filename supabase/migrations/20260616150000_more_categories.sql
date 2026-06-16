-- Broader category set reflecting the Nigerian market (products + services).
insert into public.categories (id, label, slug, icon, kind, sort, product_count) values
  ('groceries',  'Groceries & Provisions', 'groceries',            'basket',      'product', 10, 0),
  ('phones',     'Phones & Tablets',       'phones-tablets',       'smartphone',  'product', 11, 0),
  ('computing',  'Computing & Accessories','computing',            'laptop',      'product', 12, 0),
  ('beauty',     'Health & Beauty',        'health-beauty',        'sparkles',    'product', 13, 0),
  ('baby',       'Baby, Kids & Toys',      'baby-kids-toys',       'baby',        'product', 14, 0),
  ('furniture',  'Furniture & Home',       'furniture-home',       'sofa',        'product', 15, 0),
  ('books',      'Books & Stationery',     'books-stationery',     'book',        'product', 16, 0),
  ('auto',       'Automobile & Parts',     'automobile-parts',     'car',         'product', 17, 0),
  ('building',   'Building & Hardware',    'building-hardware',    'hammer',      'product', 18, 0),
  ('drinks',     'Drinks & Beverages',     'drinks-beverages',     'glass',       'product', 19, 0),
  ('tailoring',  'Tailoring & Fashion',    'tailoring-fashion',    'shirt',       'service', 20, 0),
  ('beautyspa',  'Beauty & Spa',           'beauty-spa',           'flower',      'service', 21, 0),
  ('photography','Photography & Media',    'photography-media',    'camera',      'service', 22, 0),
  ('autorepair', 'Auto Repair & Mechanics','auto-repair',          'wrench',      'service', 23, 0),
  ('laundry',    'Laundry & Dry Cleaning', 'laundry-dry-cleaning', 'droplets',    'service', 24, 0),
  ('logistics',  'Logistics & Delivery',   'logistics-delivery',   'truck',       'service', 25, 0),
  ('realestate', 'Real Estate & Housing',  'real-estate-housing',  'building',    'service', 26, 0),
  ('education',  'Tutoring & Education',    'tutoring-education',   'graduation',  'service', 27, 0),
  ('health',     'Pharmacy & Health',      'pharmacy-health',      'stethoscope', 'service', 28, 0),
  ('events',     'Events & Rentals',       'events-rentals',       'sparkles',    'service', 29, 0)
on conflict (id) do nothing;
