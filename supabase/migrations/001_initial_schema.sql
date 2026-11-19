-- Urban Wash Initial Database Schema
-- Follows Supabase & Postgres best practices: explicit schemas, indexed FKs,
-- wrapped auth.uid() RLS checks, private security-definer helpers, and non-PII public RPCs.

create schema if not exists private;

-- ============================================================================
-- 1. Tables
-- ============================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  phone text,
  default_address text,
  role text not null default 'customer' check (role in ('customer', 'rider', 'admin')),
  avatar_url text,
  email_notifications boolean not null default true,
  sms_notifications boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  description text not null,
  subtitle text not null,
  pricing_unit text not null check (pricing_unit in ('kg', 'item', 'set', 'pair', 'flat')),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  bulk_threshold numeric(10,2),
  bulk_unit_price numeric(10,2),
  price_label text not null,
  icon_key text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create sequence if not exists public.order_code_seq start with 12346;

create table if not exists public.orders (
  id bigint generated always as identity primary key,
  order_code text not null unique default ('UW' || nextval('public.order_code_seq')::text),
  user_id uuid references public.profiles (id) on delete set null,
  rider_id uuid references public.profiles (id) on delete set null,
  status text not null default 'order_placed' check (
    status in ('order_placed', 'picked_up', 'in_cleaning', 'out_for_delivery', 'delivered', 'cancelled')
  ),
  pickup_date date not null,
  pickup_time_slot text not null default '09:00 AM - 12:00 PM',
  pickup_address text not null,
  customer_name text not null,
  customer_phone text not null,
  special_instructions text,
  payment_method text not null default 'mpesa' check (payment_method in ('mpesa', 'cash_on_delivery', 'card')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  mpesa_phone text,
  mpesa_reference text,
  subtotal numeric(10,2) not null check (subtotal >= 0),
  discount_amount numeric(10,2) not null default 0 check (discount_amount >= 0),
  total_amount numeric(10,2) not null check (total_amount >= 0),
  placed_at timestamptz not null default now(),
  picked_up_at timestamptz,
  in_cleaning_at timestamptz,
  out_for_delivery_at timestamptz,
  delivered_at timestamptz,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.orders (id) on delete cascade,
  service_id bigint references public.services (id) on delete set null,
  service_name text not null,
  variant_label text,
  quantity numeric(10,2) not null check (quantity > 0),
  unit_label text not null default 'kg',
  unit_price numeric(10,2) not null check (unit_price >= 0),
  line_total numeric(10,2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  order_id bigint references public.orders (id) on delete cascade,
  title text not null,
  message text not null,
  channel text not null default 'in_app' check (channel in ('in_app', 'email', 'sms')),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 2. Indexes on Foreign Keys & Hot Query Columns
-- ============================================================================

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_rider_id_idx on public.orders (rider_id);
create index if not exists orders_status_created_at_idx on public.orders (status, created_at desc);
create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_service_id_idx on public.order_items (service_id);
create index if not exists notifications_user_id_created_at_idx on public.notifications (user_id, created_at desc);
create index if not exists notifications_order_id_idx on public.notifications (order_id);

-- ============================================================================
-- 3. Private Security Helpers & Trigger Functions
-- ============================================================================

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

create or replace function private.current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role
  from public.profiles
  where id = (select auth.uid());
$$;

revoke all on schema private from public;
grant usage on schema private to authenticated;
revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;
revoke all on function private.current_user_role() from public, anon;
grant execute on function private.current_user_role() to authenticated;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.email, ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'phone', '')), ''),
    'customer'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = case
          when public.profiles.full_name = '' then excluded.full_name
          else public.profiles.full_name
        end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create or replace function private.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role then
    if current_user in ('authenticated', 'anon') and not private.is_admin() then
      raise exception 'Only administrators can change user roles';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before update on public.profiles
  for each row execute function private.prevent_role_self_escalation();

create or replace function private.handle_order_timestamps()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  if new.status is distinct from old.status then
    if new.status = 'picked_up' and new.picked_up_at is null then
      new.picked_up_at := now();
    elsif new.status = 'in_cleaning' then
      if new.picked_up_at is null then new.picked_up_at := now(); end if;
      if new.in_cleaning_at is null then new.in_cleaning_at := now(); end if;
    elsif new.status = 'out_for_delivery' then
      if new.picked_up_at is null then new.picked_up_at := now(); end if;
      if new.in_cleaning_at is null then new.in_cleaning_at := now(); end if;
      if new.out_for_delivery_at is null then new.out_for_delivery_at := now(); end if;
    elsif new.status = 'delivered' then
      if new.picked_up_at is null then new.picked_up_at := now(); end if;
      if new.in_cleaning_at is null then new.in_cleaning_at := now(); end if;
      if new.out_for_delivery_at is null then new.out_for_delivery_at := now(); end if;
      if new.delivered_at is null then new.delivered_at := now(); end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists set_order_stage_timestamps on public.orders;
create trigger set_order_stage_timestamps
  before update on public.orders
  for each row execute function private.handle_order_timestamps();

create or replace function private.notify_on_order_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_title text;
  v_message text;
begin
  if tg_op = 'INSERT' then
    if new.user_id is not null then
      insert into public.notifications (user_id, order_id, title, message, channel)
      values (
        new.user_id,
        new.id,
        'Booking Confirmed — ' || new.order_code,
        'Your pickup is scheduled for ' || to_char(new.pickup_date, 'Mon DD, YYYY') || ' (' || new.pickup_time_slot || ').',
        'in_app'
      );
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.status is distinct from old.status and new.user_id is not null then
      case new.status
        when 'picked_up' then
          v_title := 'Order Picked Up — ' || new.order_code;
          v_message := 'Our rider has collected your laundry and is heading to the Urban Wash facility.';
        when 'in_cleaning' then
          v_title := 'Now In Cleaning — ' || new.order_code;
          v_message := 'Your clothes are being washed and cared for with gentle eco-detergents.';
        when 'out_for_delivery' then
          v_title := 'Out for Delivery — ' || new.order_code;
          v_message := 'Fresh and folded! Your order is on its way to ' || new.pickup_address || '.';
        when 'delivered' then
          v_title := 'Delivered — ' || new.order_code;
          v_message := 'Your laundry has been delivered. Thank you for choosing Urban Wash!';
        when 'cancelled' then
          v_title := 'Order Cancelled — ' || new.order_code;
          v_message := 'Order ' || new.order_code || ' has been cancelled.';
        else
          v_title := 'Order Updated — ' || new.order_code;
          v_message := 'Order status changed to ' || replace(new.status, '_', ' ') || '.';
      end case;

      insert into public.notifications (user_id, order_id, title, message, channel)
      values (new.user_id, new.id, v_title, v_message, 'in_app');
    end if;

    if new.rider_id is not null and new.rider_id is distinct from old.rider_id then
      insert into public.notifications (user_id, order_id, title, message, channel)
      values (
        new.rider_id,
        new.id,
        'New Rider Assignment — ' || new.order_code,
        'Assigned pickup/delivery at ' || new.pickup_address || ' (' || to_char(new.pickup_date, 'Mon DD') || ').',
        'in_app'
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists notify_order_lifecycle on public.orders;
create trigger notify_order_lifecycle
  after insert or update of status, rider_id on public.orders
  for each row execute function private.notify_on_order_event();

-- ============================================================================
-- 4. Row-Level Security (RLS)
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.notifications enable row level security;

-- profiles
create policy "Profiles readable by owner or admin"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()));

create policy "Profiles updatable by owner or admin"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()))
  with check (id = (select auth.uid()) or (select private.is_admin()));

-- services
create policy "Active services readable publicly"
  on public.services for select
  to anon
  using (is_active = true);

create policy "Services readable by authenticated or admin"
  on public.services for select
  to authenticated
  using (is_active = true or (select private.is_admin()));

create policy "Services insertable by admin"
  on public.services for insert
  to authenticated
  with check ((select private.is_admin()));

create policy "Services updatable by admin"
  on public.services for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Services deletable by admin"
  on public.services for delete
  to authenticated
  using ((select private.is_admin()));

-- orders
create policy "Orders readable by customer, rider, or admin"
  on public.orders for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or rider_id = (select auth.uid())
    or (select private.is_admin())
  );

create policy "Orders insertable by owner or admin"
  on public.orders for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    or (select private.is_admin())
  );

create policy "Orders updatable by admin, rider, or owner cancel"
  on public.orders for update
  to authenticated
  using (
    (select private.is_admin())
    or rider_id = (select auth.uid())
    or (user_id = (select auth.uid()) and status = 'order_placed')
  )
  with check (
    (select private.is_admin())
    or rider_id = (select auth.uid())
    or (user_id = (select auth.uid()) and status in ('order_placed', 'cancelled'))
  );

-- order_items
create policy "Order items readable via accessible order"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1
      from public.orders o
      where o.id = order_id
        and (
          o.user_id = (select auth.uid())
          or o.rider_id = (select auth.uid())
          or (select private.is_admin())
        )
    )
  );

create policy "Order items insertable via accessible order"
  on public.order_items for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.orders o
      where o.id = order_id
        and (
          o.user_id = (select auth.uid())
          or (select private.is_admin())
        )
    )
  );

-- notifications
create policy "Notifications readable by recipient or admin"
  on public.notifications for select
  to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

create policy "Notifications updatable by recipient or admin"
  on public.notifications for update
  to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()))
  with check (user_id = (select auth.uid()) or (select private.is_admin()));

create policy "Notifications insertable by admin"
  on public.notifications for insert
  to authenticated
  with check ((select private.is_admin()));

-- ============================================================================
-- 5. Sanitized Public Tracking & Transactional Booking RPCs
-- ============================================================================

create or replace function public.track_order_by_code(p_order_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_code text;
  v_result jsonb;
begin
  v_code := upper(trim(coalesce(p_order_code, '')));
  if v_code = '' then
    return null;
  end if;

  select jsonb_build_object(
    'order_code', o.order_code,
    'status', o.status,
    'pickup_date', o.pickup_date,
    'pickup_time_slot', o.pickup_time_slot,
    'total_amount', o.total_amount,
    'payment_method', o.payment_method,
    'payment_status', o.payment_status,
    'placed_at', o.placed_at,
    'picked_up_at', o.picked_up_at,
    'in_cleaning_at', o.in_cleaning_at,
    'out_for_delivery_at', o.out_for_delivery_at,
    'delivered_at', o.delivered_at,
    'items', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'service_name', oi.service_name,
            'variant_label', oi.variant_label,
            'quantity', oi.quantity,
            'unit_label', oi.unit_label,
            'line_total', oi.line_total
          )
          order by oi.id asc
        )
        from public.order_items oi
        where oi.order_id = o.id
      ),
      '[]'::jsonb
    )
  )
  into v_result
  from public.orders o
  where upper(o.order_code) = v_code
  limit 1;

  return v_result;
end;
$$;

create or replace function public.create_order(
  p_service_slug text,
  p_quantity numeric,
  p_duvet_size text default null,
  p_add_stain_removal boolean default false,
  p_pickup_date date default current_date,
  p_pickup_time_slot text default '09:00 AM - 12:00 PM',
  p_pickup_address text default '',
  p_customer_name text default '',
  p_customer_phone text default '',
  p_special_instructions text default null,
  p_payment_method text default 'mpesa',
  p_mpesa_phone text default null,
  p_mpesa_reference text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_service public.services%rowtype;
  v_stain_service public.services%rowtype;
  v_qty numeric(10,2);
  v_base_unit_price numeric(10,2);
  v_effective_unit_price numeric(10,2);
  v_variant_label text;
  v_regular_line numeric(10,2);
  v_actual_line numeric(10,2);
  v_discount numeric(10,2) := 0;
  v_addon_total numeric(10,2) := 0;
  v_subtotal numeric(10,2);
  v_total numeric(10,2);
  v_payment_method text;
  v_payment_status text;
  v_order public.orders%rowtype;
begin
  v_user_id := auth.uid();
  v_qty := round(coalesce(p_quantity, 0)::numeric, 2);

  if v_qty <= 0 then
    raise exception 'Quantity or weight must be greater than zero';
  end if;

  if trim(coalesce(p_pickup_address, '')) = '' then
    raise exception 'Pickup address is required';
  end if;

  if trim(coalesce(p_customer_name, '')) = '' then
    raise exception 'Customer name is required';
  end if;

  if trim(coalesce(p_customer_phone, '')) = '' then
    raise exception 'Customer phone number is required';
  end if;

  v_payment_method := lower(trim(coalesce(p_payment_method, 'mpesa')));
  if v_payment_method not in ('mpesa', 'cash_on_delivery', 'card') then
    raise exception 'Invalid payment method';
  end if;

  select *
  into v_service
  from public.services
  where slug = trim(p_service_slug)
    and is_active = true
  limit 1;

  if not found then
    raise exception 'Selected service was not found or is inactive';
  end if;

  v_base_unit_price := v_service.unit_price;
  v_effective_unit_price := v_service.unit_price;
  v_variant_label := null;

  if v_service.slug = 'duvet-wash-dry' then
    case coalesce(trim(p_duvet_size), '4x6')
      when '3x6' then
        v_base_unit_price := 500;
        v_effective_unit_price := 500;
        v_variant_label := '3x6 Duvet';
      when '4x6' then
        v_base_unit_price := 700;
        v_effective_unit_price := 700;
        v_variant_label := '4x6 Duvet';
      when '5x6' then
        v_base_unit_price := 900;
        v_effective_unit_price := 900;
        v_variant_label := '5x6 Duvet';
      else
        v_base_unit_price := 700;
        v_effective_unit_price := 700;
        v_variant_label := '4x6 Duvet';
    end case;
  elsif v_service.bulk_threshold is not null
    and v_service.bulk_unit_price is not null
    and v_qty >= v_service.bulk_threshold then
    v_effective_unit_price := v_service.bulk_unit_price;
    v_variant_label := '10kg+ Bulk Rate';
  end if;

  v_regular_line := round(v_base_unit_price * v_qty, 2);
  v_actual_line := round(v_effective_unit_price * v_qty, 2);
  v_discount := greatest(v_regular_line - v_actual_line, 0);

  if coalesce(p_add_stain_removal, false) and v_service.slug <> 'stain-removal' then
    select *
    into v_stain_service
    from public.services
    where slug = 'stain-removal'
      and is_active = true
    limit 1;

    if found then
      v_addon_total := v_stain_service.unit_price;
    else
      v_addon_total := 200;
    end if;
  end if;

  v_subtotal := v_regular_line + v_addon_total;
  v_total := v_subtotal - v_discount;

  if v_payment_method = 'mpesa' and trim(coalesce(p_mpesa_reference, '')) <> '' then
    v_payment_status := 'paid';
  else
    v_payment_status := 'pending';
  end if;

  insert into public.orders (
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
    mpesa_phone,
    mpesa_reference,
    subtotal,
    discount_amount,
    total_amount
  )
  values (
    v_user_id,
    'order_placed',
    coalesce(p_pickup_date, current_date),
    coalesce(nullif(trim(p_pickup_time_slot), ''), '09:00 AM - 12:00 PM'),
    trim(p_pickup_address),
    trim(p_customer_name),
    trim(p_customer_phone),
    nullif(trim(coalesce(p_special_instructions, '')), ''),
    v_payment_method,
    v_payment_status,
    nullif(trim(coalesce(p_mpesa_phone, '')), ''),
    nullif(trim(coalesce(p_mpesa_reference, '')), ''),
    v_subtotal,
    v_discount,
    v_total
  )
  returning * into v_order;

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
  values (
    v_order.id,
    v_service.id,
    v_service.name,
    v_variant_label,
    v_qty,
    v_service.pricing_unit,
    v_effective_unit_price,
    v_actual_line
  );

  if v_addon_total > 0 then
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
    values (
      v_order.id,
      v_stain_service.id,
      coalesce(v_stain_service.name, 'Stain Removal'),
      'Pre-treatment add-on',
      1,
      'item',
      v_addon_total,
      v_addon_total
    );
  end if;

  return jsonb_build_object(
    'id', v_order.id,
    'order_code', v_order.order_code,
    'status', v_order.status,
    'subtotal', v_order.subtotal,
    'discount_amount', v_order.discount_amount,
    'total_amount', v_order.total_amount,
    'payment_status', v_order.payment_status
  );
end;
$$;

grant execute on function public.track_order_by_code(text) to anon, authenticated;
grant execute on function public.create_order(
  text, numeric, text, boolean, date, text, text, text, text, text, text, text, text
) to anon, authenticated;

-- ============================================================================
-- 6. Grants & Realtime Publication
-- ============================================================================

grant usage on schema public to anon, authenticated;
grant select on public.services to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update on public.orders to authenticated;
grant select, insert on public.order_items to authenticated;
grant select, update, insert on public.notifications to authenticated;
grant insert, update, delete on public.services to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end
$$;
