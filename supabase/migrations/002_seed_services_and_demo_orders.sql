-- Urban Wash Seed Data: Blueprint Services + Public Demo Tracking Orders

insert into public.services (
  slug,
  name,
  description,
  subtitle,
  pricing_unit,
  unit_price,
  bulk_threshold,
  bulk_unit_price,
  price_label,
  icon_key,
  is_active,
  sort_order
)
values
  (
    'laundry-by-weight',
    'Laundry (by weight)',
    'Everyday wash, dry, and neatly folded clothes using gentle detergents.',
    'Discount KSh 180/kg (10kg+)',
    'kg',
    200.00,
    10.00,
    180.00,
    'KSh 200/kg',
    'washing-machine',
    true,
    1
  ),
  (
    'dry-cleaning',
    'Dry Cleaning',
    'Professional solvent care and steam finishing for tailored garments.',
    'Suits, dresses, etc.',
    'item',
    600.00,
    null,
    null,
    'KSh 600+',
    'shirt',
    true,
    2
  ),
  (
    'duvet-wash-dry',
    'Duvet Wash & Dry',
    'Deep hygienic wash and low-heat tumble drying for bulky bedding.',
    '4x6 Duvet = KSh 700',
    'item',
    500.00,
    null,
    null,
    'From KSh 500',
    'bed',
    true,
    3
  ),
  (
    'curtain-cleaning',
    'Curtain Cleaning',
    'Dust extraction, fabric-safe wash, and crisp press for drapes and sheers.',
    'per set',
    'set',
    600.00,
    null,
    null,
    'KSh 600+',
    'curtains',
    true,
    4
  ),
  (
    'shoe-cleaning',
    'Shoe Cleaning',
    'Deep sole, midsole, and upper restoration for sneakers, leather, and suede.',
    'per pair',
    'pair',
    400.00,
    null,
    null,
    'KSh 400+',
    'footprints',
    true,
    5
  ),
  (
    'stain-removal',
    'Stain Removal',
    'Targeted enzymatic spot treatment for tough coffee, grease, ink, or wine marks.',
    'extra charge',
    'item',
    200.00,
    null,
    null,
    'KSh 200+',
    'sparkles',
    true,
    6
  )
on conflict (slug) do update
  set name = excluded.name,
      description = excluded.description,
      subtitle = excluded.subtitle,
      pricing_unit = excluded.pricing_unit,
      unit_price = excluded.unit_price,
      bulk_threshold = excluded.bulk_threshold,
      bulk_unit_price = excluded.bulk_unit_price,
      price_label = excluded.price_label,
      icon_key = excluded.icon_key,
      is_active = excluded.is_active,
      sort_order = excluded.sort_order;

-- Demo tracking orders matching blueprint codes (UW12345, UW12344, UW12343)
-- Note: user_id is NULL and is_demo = true; public tracking uses track_order_by_code RPC with zero PII exposure.
insert into public.orders (
  order_code,
  user_id,
  status,
  pickup_date,
  pickup_time_slot,
  pickup_address,
  customer_name,
  customer_phone,
  special_instructions,
  payment_method,
  payment_status,
  subtotal,
  discount_amount,
  total_amount,
  placed_at,
  picked_up_at,
  in_cleaning_at,
  out_for_delivery_at,
  delivered_at,
  is_demo
)
values
  (
    'UW12345',
    null,
    'in_cleaning',
    current_date,
    '11:00 AM - 02:00 PM',
    'Westlands, Nairobi',
    'Charles Kamau',
    '+254700000001',
    'Separate whites and darks please',
    'mpesa',
    'paid',
    1000.00,
    0.00,
    1000.00,
    now() - interval '3 hours 10 minutes',
    now() - interval '1 hour 45 minutes',
    now() - interval '25 minutes',
    null,
    null,
    true
  ),
  (
    'UW12344',
    null,
    'picked_up',
    current_date,
    '08:00 AM - 11:00 AM',
    'Kilimani, Nairobi',
    'Charles Kamau',
    '+254700000001',
    'Two-piece wool suit on hanger',
    'mpesa',
    'paid',
    1200.00,
    0.00,
    1200.00,
    now() - interval '1 day 4 hours',
    now() - interval '1 day 1 hour',
    null,
    null,
    null,
    true
  ),
  (
    'UW12343',
    null,
    'delivered',
    current_date - 2,
    '02:00 PM - 05:00 PM',
    'Kileleshwa, Nairobi',
    'Charles Kamau',
    '+254700000001',
    'Low heat tumble dry',
    'cash_on_delivery',
    'paid',
    700.00,
    0.00,
    700.00,
    now() - interval '2 days 6 hours',
    now() - interval '2 days 4 hours',
    now() - interval '2 days 2 hours',
    now() - interval '1 day 20 hours',
    now() - interval '1 day 18 hours',
    true
  )
on conflict (order_code) do nothing;

insert into public.order_items (
  order_id,
  service_id,
  service_name,
  variant_label,
  quantity,
  unit_label,
  unit_price,
  line_total
)
select o.id, s.id, s.name, '5kg everyday load', 5, 'kg', 200.00, 1000.00
from public.orders o
join public.services s on s.slug = 'laundry-by-weight'
where o.order_code = 'UW12345'
  and not exists (select 1 from public.order_items oi where oi.order_id = o.id);

insert into public.order_items (
  order_id,
  service_id,
  service_name,
  variant_label,
  quantity,
  unit_label,
  unit_price,
  line_total
)
select o.id, s.id, s.name, 'Suits & tailored wear', 2, 'item', 600.00, 1200.00
from public.orders o
join public.services s on s.slug = 'dry-cleaning'
where o.order_code = 'UW12344'
  and not exists (select 1 from public.order_items oi where oi.order_id = o.id);

insert into public.order_items (
  order_id,
  service_id,
  service_name,
  variant_label,
  quantity,
  unit_label,
  unit_price,
  line_total
)
select o.id, s.id, s.name, '4x6 Duvet', 1, 'item', 700.00, 700.00
from public.orders o
join public.services s on s.slug = 'duvet-wash-dry'
where o.order_code = 'UW12343'
  and not exists (select 1 from public.order_items oi where oi.order_id = o.id);
