-- SmartDine complete database setup
-- Run this once in the Supabase SQL Editor (Dashboard → SQL → New query).
-- Safe to re-run: missing columns, policies, and publications are handled.
--
-- Tables the Next.js app actually queries:
--   restaurants, dishes (menu catalog), orders (line items in jsonb),
--   restaurant_admins, reviews
-- Plus: storage.buckets "logos", Realtime on dishes / orders / reviews.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum ('pending', 'preparing', 'ready', 'completed');
  end if;
  if not exists (select 1 from pg_type where typname = 'order_storage_status') then
    create type public.order_storage_status as enum ('paid', 'cancelled', 'changed');
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Tables (fresh projects)
-- ---------------------------------------------------------------------------
create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo text,
  currency text not null default 'MAD',
  plan text not null default 'starter',
  owner_id uuid,
  phone text,
  default_locale text not null default 'fr',
  is_trial boolean not null default false,
  trial_ends_at timestamptz,
  suspended boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.dishes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null,
  title_ar text not null default '',
  title_fr text not null default '',
  title_en text not null default '',
  description jsonb not null default '{}'::jsonb,
  price numeric(10, 2) not null default 0,
  category text not null default 'mains',
  image_url text,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null,
  table_number text,
  items jsonb not null default '[]'::jsonb,
  status public.order_status not null default 'pending',
  storage_status public.order_storage_status,
  total_amount numeric(10, 2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.restaurant_admins (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null,
  user_id uuid,
  email text not null,
  full_name text not null default '',
  role text not null default 'owner',
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null,
  rating smallint not null default 5,
  comment text,
  table_number text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Missing columns on older projects (CREATE TABLE IF NOT EXISTS will not add them)
-- ---------------------------------------------------------------------------
alter table public.restaurants add column if not exists logo text;
alter table public.restaurants add column if not exists currency text;
alter table public.restaurants add column if not exists plan text;
alter table public.restaurants add column if not exists owner_id uuid;
alter table public.restaurants add column if not exists phone text;
alter table public.restaurants add column if not exists default_locale text;
alter table public.restaurants add column if not exists is_trial boolean;
alter table public.restaurants add column if not exists trial_ends_at timestamptz;
alter table public.restaurants add column if not exists suspended boolean;
alter table public.restaurants add column if not exists created_at timestamptz;

alter table public.dishes add column if not exists title_ar text;
alter table public.dishes add column if not exists title_fr text;
alter table public.dishes add column if not exists title_en text;
alter table public.dishes add column if not exists description jsonb;
alter table public.dishes add column if not exists price numeric(10, 2);
alter table public.dishes add column if not exists category text;
alter table public.dishes add column if not exists image_url text;
alter table public.dishes add column if not exists is_available boolean;
alter table public.dishes add column if not exists created_at timestamptz;

alter table public.orders add column if not exists table_number text;
alter table public.orders add column if not exists items jsonb;
alter table public.orders add column if not exists status public.order_status;
alter table public.orders add column if not exists total_amount numeric(10, 2);
alter table public.orders add column if not exists notes text;
alter table public.orders add column if not exists storage_status public.order_storage_status;
alter table public.orders add column if not exists created_at timestamptz;

alter table public.reviews add column if not exists rating smallint;
alter table public.reviews add column if not exists comment text;
alter table public.reviews add column if not exists table_number text;
alter table public.reviews add column if not exists created_at timestamptz;

-- ---------------------------------------------------------------------------
-- Backfill, defaults, and checks
-- ---------------------------------------------------------------------------
update public.restaurants set currency = 'MAD' where currency is null or btrim(currency) = '';
update public.restaurants set plan = 'starter' where plan is null or plan not in ('starter', 'pro', 'enterprise');
update public.restaurants set default_locale = 'fr' where default_locale is null or default_locale not in ('ar', 'fr', 'en');
update public.restaurants set created_at = now() where created_at is null;
update public.restaurants
set
  trial_ends_at = coalesce(trial_ends_at, created_at + interval '7 days'),
  is_trial = true
where plan = 'starter';
update public.restaurants
set is_trial = false
where plan is distinct from 'starter';
update public.restaurants set is_trial = false where is_trial is null;
update public.restaurants set suspended = false where suspended is null;

update public.dishes set title_ar = coalesce(title_ar, '');
update public.dishes set title_fr = coalesce(title_fr, '');
update public.dishes set title_en = coalesce(title_en, '');
update public.dishes set description = '{}'::jsonb where description is null;
update public.dishes set price = 0 where price is null or price < 0;
update public.dishes set category = 'mains' where category is null or category not in ('starters', 'mains', 'drinks');
update public.dishes set is_available = true where is_available is null;
update public.dishes set created_at = now() where created_at is null;

update public.orders set items = '[]'::jsonb where items is null;
update public.orders set total_amount = 0 where total_amount is null;
update public.orders set created_at = now() where created_at is null;
update public.orders set status = 'pending' where status is null;

update public.reviews set rating = 5 where rating is null or rating < 1 or rating > 5;
update public.reviews set created_at = now() where created_at is null;

alter table public.restaurants alter column currency set default 'MAD';
alter table public.restaurants alter column plan set default 'starter';
alter table public.restaurants alter column default_locale set default 'fr';
alter table public.restaurants alter column is_trial set default false;
alter table public.restaurants alter column suspended set default false;
alter table public.restaurants alter column created_at set default now();

do $$
begin
  alter table public.restaurants alter column currency set not null;
  alter table public.restaurants alter column plan set not null;
  alter table public.restaurants alter column default_locale set not null;
  alter table public.restaurants alter column is_trial set not null;
  alter table public.restaurants alter column suspended set not null;
exception
  when others then
    raise notice 'restaurants not-null skipped: %', sqlerrm;
end
$$;

alter table public.dishes alter column description set default '{}'::jsonb;
alter table public.dishes alter column price set default 0;
alter table public.dishes alter column category set default 'mains';
alter table public.dishes alter column is_available set default true;
alter table public.orders alter column items set default '[]'::jsonb;
alter table public.orders alter column total_amount set default 0;
alter table public.orders alter column status set default 'pending';

do $$
begin
  alter table public.restaurants drop constraint if exists restaurants_plan_check;
  alter table public.restaurants
    add constraint restaurants_plan_check check (plan in ('starter', 'pro', 'enterprise'));
exception
  when others then
    raise notice 'restaurants_plan_check skipped: %', sqlerrm;
end
$$;

do $$
begin
  alter table public.restaurants drop constraint if exists restaurants_default_locale_check;
  alter table public.restaurants
    add constraint restaurants_default_locale_check check (default_locale in ('ar', 'fr', 'en'));
exception
  when others then
    raise notice 'restaurants_default_locale_check skipped: %', sqlerrm;
end
$$;

do $$
begin
  alter table public.dishes drop constraint if exists dishes_price_check;
  alter table public.dishes
    add constraint dishes_price_check check (price >= 0);
exception
  when others then
    raise notice 'dishes_price_check skipped: %', sqlerrm;
end
$$;

do $$
begin
  alter table public.dishes drop constraint if exists dishes_category_check;
  alter table public.dishes
    add constraint dishes_category_check check (category in ('starters', 'mains', 'drinks'));
exception
  when others then
    raise notice 'dishes_category_check skipped: %', sqlerrm;
end
$$;

do $$
begin
  alter table public.reviews drop constraint if exists reviews_rating_check;
  alter table public.reviews
    add constraint reviews_rating_check check (rating between 1 and 5);
exception
  when others then
    raise notice 'reviews_rating_check skipped: %', sqlerrm;
end
$$;

-- Convert orders.status from text → enum when an older schema used text.
do $$
declare
  status_type text;
begin
  select c.udt_name into status_type
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'orders'
    and c.column_name = 'status';

  if status_type in ('text', 'varchar', 'bpchar') then
    update public.orders
    set status = 'pending'
    where status is null
       or status::text not in ('pending', 'preparing', 'ready', 'completed');
    alter table public.orders
      alter column status type public.order_status
      using status::public.order_status;
  end if;
exception
  when others then
    raise notice 'orders.status enum convert skipped: %', sqlerrm;
end
$$;

-- ---------------------------------------------------------------------------
-- Foreign keys (each table separately so one orphan set cannot skip the rest)
-- ---------------------------------------------------------------------------
do $$
begin
  alter table public.dishes drop constraint if exists dishes_restaurant_id_fkey;
  alter table public.dishes
    add constraint dishes_restaurant_id_fkey
    foreign key (restaurant_id) references public.restaurants(id) on delete cascade;
exception
  when others then
    raise notice 'dishes FK skipped (likely orphan rows): %', sqlerrm;
end
$$;

do $$
begin
  alter table public.orders drop constraint if exists orders_restaurant_id_fkey;
  alter table public.orders
    add constraint orders_restaurant_id_fkey
    foreign key (restaurant_id) references public.restaurants(id) on delete cascade;
exception
  when others then
    raise notice 'orders FK skipped (likely orphan rows): %', sqlerrm;
end
$$;

do $$
begin
  alter table public.restaurant_admins drop constraint if exists restaurant_admins_restaurant_id_fkey;
  alter table public.restaurant_admins
    add constraint restaurant_admins_restaurant_id_fkey
    foreign key (restaurant_id) references public.restaurants(id) on delete cascade;
exception
  when others then
    raise notice 'restaurant_admins FK skipped (likely orphan rows): %', sqlerrm;
end
$$;

do $$
begin
  alter table public.reviews drop constraint if exists reviews_restaurant_id_fkey;
  alter table public.reviews
    add constraint reviews_restaurant_id_fkey
    foreign key (restaurant_id) references public.restaurants(id) on delete cascade;
exception
  when others then
    raise notice 'reviews FK skipped (likely orphan rows): %', sqlerrm;
end
$$;

do $$
begin
  alter table public.restaurant_admins drop constraint if exists restaurant_admins_restaurant_id_email_key;
  alter table public.restaurant_admins
    add constraint restaurant_admins_restaurant_id_email_key unique (restaurant_id, email);
exception
  when others then
    raise notice 'admins unique skipped: %', sqlerrm;
end
$$;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
do $$
begin
  execute 'create unique index if not exists restaurants_slug_key on public.restaurants (slug)';
exception
  when others then
    raise notice 'restaurants slug unique index skipped: %', sqlerrm;
end
$$;

create index if not exists dishes_restaurant_id_idx on public.dishes (restaurant_id);
create index if not exists restaurant_admins_restaurant_id_idx on public.restaurant_admins (restaurant_id);
create index if not exists orders_restaurant_id_idx on public.orders (restaurant_id);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists reviews_restaurant_id_idx on public.reviews (restaurant_id);
create index if not exists reviews_created_at_idx on public.reviews (created_at desc);

-- ---------------------------------------------------------------------------
-- Replica identity (required for Realtime UPDATE/DELETE payloads)
-- ---------------------------------------------------------------------------
alter table public.restaurants replica identity full;
alter table public.dishes replica identity full;
alter table public.orders replica identity full;
alter table public.restaurant_admins replica identity full;
alter table public.reviews replica identity full;

-- ---------------------------------------------------------------------------
-- Grants (anon key used by the MVP)
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Row Level Security — open for the prototype (tighten before production)
-- ---------------------------------------------------------------------------
alter table public.restaurants enable row level security;
alter table public.dishes enable row level security;
alter table public.orders enable row level security;
alter table public.restaurant_admins enable row level security;
alter table public.reviews enable row level security;

drop policy if exists "restaurants_public_read" on public.restaurants;
drop policy if exists "restaurants_public_write" on public.restaurants;
drop policy if exists "dishes_public_read" on public.dishes;
drop policy if exists "dishes_public_write" on public.dishes;
drop policy if exists "orders_public_read" on public.orders;
drop policy if exists "orders_public_write" on public.orders;
drop policy if exists "admins_public_read" on public.restaurant_admins;
drop policy if exists "admins_public_write" on public.restaurant_admins;
drop policy if exists "reviews_public_read" on public.reviews;
drop policy if exists "reviews_public_write" on public.reviews;

create policy "restaurants_public_read" on public.restaurants for select using (true);
create policy "restaurants_public_write" on public.restaurants for all using (true) with check (true);
create policy "dishes_public_read" on public.dishes for select using (true);
create policy "dishes_public_write" on public.dishes for all using (true) with check (true);
create policy "orders_public_read" on public.orders for select using (true);
create policy "orders_public_write" on public.orders for all using (true) with check (true);
create policy "admins_public_read" on public.restaurant_admins for select using (true);
create policy "admins_public_write" on public.restaurant_admins for all using (true) with check (true);
create policy "reviews_public_read" on public.reviews for select using (true);
create policy "reviews_public_write" on public.reviews for all using (true) with check (true);

-- Super-admin helper + subscription column lock
-- Anon/authenticated may still insert restaurants (onboarding) and update profile fields.
-- Plan / trial / suspended changes go through the service role API only.
create table if not exists public.super_admins (
  email text primary key
);

alter table public.super_admins enable row level security;
revoke all on table public.super_admins from anon, authenticated;

drop policy if exists "super_admins_no_public" on public.super_admins;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.super_admins s
    where lower(s.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_super_admin() from public;
grant execute on function public.is_super_admin() to anon, authenticated, service_role;

drop policy if exists "restaurants_super_admin_all" on public.restaurants;
create policy "restaurants_super_admin_all"
  on public.restaurants
  for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

do $$
begin
  revoke update on table public.restaurants from anon, authenticated;
  grant update (
    name, slug, logo, currency, owner_id, phone, default_locale
  ) on table public.restaurants to anon, authenticated;
exception
  when others then
    raise notice 'restaurant column grants: %', sqlerrm;
end
$$;

-- ---------------------------------------------------------------------------
-- Compatibility views. The app reads public.dishes and orders.items jsonb;
-- menu_items / order_items exist so SQL that expects those names still works.
do $$
begin
  execute $v$
    create or replace view public.menu_items
      with (security_invoker = true)
      as select * from public.dishes
  $v$;
  execute 'grant select on public.menu_items to anon, authenticated, service_role';
exception
  when others then
    raise notice 'menu_items view skipped: %', sqlerrm;
end
$$;

do $$
begin
  execute $v$
    create or replace view public.order_items
      with (security_invoker = true)
      as
      select
        o.id as order_id,
        o.restaurant_id,
        o.table_number,
        o.status,
        line.line_no,
        line.item
      from public.orders o
      cross join lateral jsonb_array_elements(coalesce(o.items, '[]'::jsonb))
        with ordinality as line(item, line_no)
  $v$;
  execute 'grant select on public.order_items to anon, authenticated, service_role';
exception
  when others then
    raise notice 'order_items view skipped: %', sqlerrm;
end
$$;

-- ---------------------------------------------------------------------------
-- Storage: public logo bucket
-- ---------------------------------------------------------------------------
do $$
begin
  insert into storage.buckets (id, name, public)
  values ('logos', 'logos', true)
  on conflict (id) do update set public = true;
  insert into storage.buckets (id, name, public)
  values ('dishes', 'dishes', true)
  on conflict (id) do update set public = true;
exception
  when undefined_table then
    raise notice 'storage.buckets not present — skip logo/dish buckets';
  when others then
    raise notice 'storage buckets: %', sqlerrm;
end
$$;

do $$
begin
  execute 'alter table storage.objects enable row level security';
  execute 'drop policy if exists "logos_public_read" on storage.objects';
  execute 'drop policy if exists "logos_public_write" on storage.objects';
  execute 'drop policy if exists "logos_public_update" on storage.objects';
  execute 'drop policy if exists "logos_public_delete" on storage.objects';
  execute 'drop policy if exists "dishes_public_read" on storage.objects';
  execute 'drop policy if exists "dishes_public_write" on storage.objects';
  execute 'drop policy if exists "dishes_public_update" on storage.objects';
  execute 'drop policy if exists "dishes_public_delete" on storage.objects';
  execute $p$
    create policy "logos_public_read"
      on storage.objects for select
      using (bucket_id = 'logos')
  $p$;
  execute $p$
    create policy "logos_public_write"
      on storage.objects for insert
      with check (bucket_id = 'logos')
  $p$;
  execute $p$
    create policy "logos_public_update"
      on storage.objects for update
      using (bucket_id = 'logos')
      with check (bucket_id = 'logos')
  $p$;
  execute $p$
    create policy "logos_public_delete"
      on storage.objects for delete
      using (bucket_id = 'logos')
  $p$;
  execute $p$
    create policy "dishes_public_read"
      on storage.objects for select
      using (bucket_id = 'dishes')
  $p$;
  execute $p$
    create policy "dishes_public_write"
      on storage.objects for insert
      with check (bucket_id = 'dishes')
  $p$;
  execute $p$
    create policy "dishes_public_update"
      on storage.objects for update
      using (bucket_id = 'dishes')
      with check (bucket_id = 'dishes')
  $p$;
  execute $p$
    create policy "dishes_public_delete"
      on storage.objects for delete
      using (bucket_id = 'dishes')
  $p$;
exception
  when undefined_table then
    raise notice 'storage.objects not present — skip storage policies';
  when others then
    raise notice 'storage policies: %', sqlerrm;
end
$$;

-- ---------------------------------------------------------------------------
-- Realtime — KDS tickets, dish 86, review analytics
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    execute 'create publication supabase_realtime';
  end if;
end
$$;

do $$
begin
  begin
    alter publication supabase_realtime add table public.dishes;
  exception
    when duplicate_object then null;
    when undefined_object then
      raise notice 'publication supabase_realtime missing';
  end;
  begin
    alter publication supabase_realtime add table public.orders;
  exception
    when duplicate_object then null;
    when undefined_object then
      raise notice 'publication supabase_realtime missing';
  end;
  begin
    alter publication supabase_realtime add table public.reviews;
  exception
    when duplicate_object then null;
    when undefined_object then
      raise notice 'publication supabase_realtime missing';
  end;
end
$$;

-- ---------------------------------------------------------------------------
-- Demo restaurant (Dar Zitoun) so /menu/dar-zitoun works immediately
-- ---------------------------------------------------------------------------
do $$
begin
  insert into public.restaurants (id, name, slug, logo, currency, plan, default_locale)
  values (
    '11111111-1111-4111-8111-111111111111',
    'Dar Zitoun',
    'dar-zitoun',
    null,
    'MAD',
    'pro',
    'fr'
  )
  on conflict (slug) do update
  set name = excluded.name,
      currency = excluded.currency,
      plan = excluded.plan,
      default_locale = excluded.default_locale;
exception
  when unique_violation then
    raise notice 'demo restaurant id/slug already taken — skip seed restaurant';
  when others then
    begin
      insert into public.restaurants (id, name, slug, logo, currency, plan, default_locale)
      select
        '11111111-1111-4111-8111-111111111111',
        'Dar Zitoun',
        'dar-zitoun',
        null,
        'MAD',
        'pro',
        'fr'
      where not exists (
        select 1 from public.restaurants r where r.slug = 'dar-zitoun'
      );
    exception
      when others then
        raise notice 'demo restaurant seed skipped: %', sqlerrm;
    end;
end
$$;

do $$
begin
  insert into public.dishes (
    restaurant_id, title_ar, title_fr, title_en, description, price, category, image_url, is_available
  )
  select
    r.id,
    seed.title_ar,
    seed.title_fr,
    seed.title_en,
    seed.description,
    seed.price,
    seed.category,
    seed.image_url,
    seed.is_available
  from (
    select id
    from public.restaurants
    where slug = 'dar-zitoun'
       or id = '11111111-1111-4111-8111-111111111111'
    order by case when slug = 'dar-zitoun' then 0 else 1 end
    limit 1
  ) r
  cross join (
    values
      (
        'زعلوك', 'Zaalouk', 'Zaalouk',
        '{"ar":"سلطة باذنجان مشوي بزيت الزيتون والكمون والكزبرة.","fr":"Salade d’aubergines grillées à l’huile d’olive, cumin et coriandre.","en":"Charred eggplant salad with olive oil, cumin, and coriander."}'::jsonb,
        35::numeric, 'starters', null::text, true
      ),
      (
        'بريوات الجبن', 'Briouats au fromage', 'Cheese briouats',
        '{"ar":"مثلثات مقرمشة محشوة بالجبن العشبي، تقدم مع عسل حر.","fr":"Triangles feuilletés au fromage aux herbes, servis avec du miel.","en":"Crisp pastry triangles filled with herbed cheese, served with honey."}'::jsonb,
        45::numeric, 'starters', null::text, true
      ),
      (
        'حريرة', 'Harira', 'Harira',
        '{"ar":"شوربة العدس والطماطم بالحمص والكسبرة.","fr":"Soupe de lentilles et tomates, pois chiches et coriandre.","en":"Lentil and tomato soup with chickpeas and coriander."}'::jsonb,
        28::numeric, 'starters', null::text, true
      ),
      (
        'بسطيلة الدجاج', 'Pastilla au poulet', 'Chicken pastilla',
        '{"ar":"ورقة مقرمشة، دجاج مسكر باللوز والقرفة.","fr":"Feuilleté croustillant, poulet, amandes et cannelle, sucre glace.","en":"Crisp warqa pastry, spiced chicken, almonds, cinnamon, and icing sugar."}'::jsonb,
        95::numeric, 'mains', null::text, true
      ),
      (
        'طاجين الدجاج بالزيتون والحامض', 'Tajine de poulet citron olives', 'Chicken tagine with lemon & olives',
        '{"ar":"دجاج بلدي متبل بالزنجبيل والزعفران، زيتون أخضر وحامض مملح.","fr":"Poulet fermier, gingembre, safran, olives vertes et citron confit.","en":"Farm chicken with ginger, saffron, green olives, and preserved lemon."}'::jsonb,
        85::numeric, 'mains', null::text, true
      ),
      (
        'كسكس ملكي', 'Couscous royal', 'Royal couscous',
        '{"ar":"كسكس ناعم، لحم الغنم، الدجاج، والمرق بالخضر الموسمية.","fr":"Semoule fine, agneau, poulet et bouillon aux légumes de saison.","en":"Steamed semolina, lamb, chicken, and a seasonal vegetable broth."}'::jsonb,
        120::numeric, 'mains', null::text, true
      ),
      (
        'أتاي بالنعناع', 'Thé à la menthe', 'Moroccan mint tea',
        '{"ar":"شاي أخضر بالنعناع الطازج، يُسكب من علٍ في كأس بلوري.","fr":"Thé vert à la menthe fraîche, versé de haut dans un verre.","en":"Gunpowder green tea with fresh mint, poured from height into a glass."}'::jsonb,
        18::numeric, 'drinks', null::text, true
      ),
      (
        'عصير البرتقال', 'Jus d’orange pressé', 'Fresh orange juice',
        '{"ar":"برتقال المغرب المعصور عند الطلب، بلا سكر مضاف.","fr":"Oranges marocaines pressées minute, sans sucre ajouté.","en":"Moroccan oranges pressed to order, no added sugar."}'::jsonb,
        22::numeric, 'drinks', null::text, true
      ),
      (
        'عصير الأفوكادو باللوز', 'Jus d’avocat amande', 'Avocado almond juice',
        '{"ar":"أفوكادو كريمي، حليب اللوز، ولمسة ماء الزهر.","fr":"Avocat onctueux, lait d’amande et une touche d’eau de fleur d’oranger.","en":"Creamy avocado, almond milk, and a drop of orange-blossom water."}'::jsonb,
        32::numeric, 'drinks', null::text, false
      )
  ) as seed(
    title_ar, title_fr, title_en, description, price, category, image_url, is_available
  )
  where not exists (
    select 1 from public.dishes d where d.restaurant_id = r.id
  );
exception
  when others then
    raise notice 'demo dishes seed skipped: %', sqlerrm;
end
$$;

do $$
begin
  raise notice 'SmartDine complete_setup.sql finished.';
end
$$;
