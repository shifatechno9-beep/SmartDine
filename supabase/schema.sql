-- SmartDine schema — run in the Supabase SQL editor.
-- Core tables:
--   restaurants (id, name, slug, currency, created_at)
--   dishes (id, restaurant_id, title_ar, title_fr, title_en, description, price, category, image_url, is_available)
--   orders (id, restaurant_id, table_number, items jsonb, status pending|preparing|ready|completed, total_amount, created_at)
-- Extra columns (logo, plan, owner_id, notes, restaurant_admins) support onboarding and KDS notes.
-- Enable Realtime for public.orders (and dishes) so the kitchen display updates live.

create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type order_status as enum ('pending', 'preparing', 'ready', 'completed');
  end if;
end
$$;

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo text,
  currency text not null default 'MAD',
  plan text not null default 'starter' check (plan in ('starter', 'pro', 'enterprise')),
  owner_id uuid,
  phone text,
  default_locale text not null default 'fr' check (default_locale in ('ar', 'fr', 'en')),
  is_trial boolean not null default false,
  trial_ends_at timestamptz,
  suspended boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.dishes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  title_ar text not null default '',
  title_fr text not null default '',
  title_en text not null default '',
  description jsonb not null default '{}'::jsonb,
  price numeric(10, 2) not null check (price >= 0),
  category text not null check (category in ('starters', 'mains', 'drinks')),
  image_url text,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  table_number text,
  items jsonb not null default '[]'::jsonb,
  status order_status not null default 'pending',
  total_amount numeric(10, 2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.restaurant_admins (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id uuid,
  email text not null,
  full_name text not null default '',
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  unique (restaurant_id, email)
);

create index if not exists dishes_restaurant_id_idx on public.dishes (restaurant_id);
create index if not exists restaurant_admins_restaurant_id_idx on public.restaurant_admins (restaurant_id);
create index if not exists orders_restaurant_id_idx on public.orders (restaurant_id);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  table_number text,
  created_at timestamptz not null default now()
);

create index if not exists reviews_restaurant_id_idx on public.reviews (restaurant_id);
create index if not exists reviews_created_at_idx on public.reviews (created_at desc);

alter table public.restaurants replica identity full;
alter table public.dishes replica identity full;
alter table public.orders replica identity full;
alter table public.restaurant_admins replica identity full;
alter table public.reviews replica identity full;

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

do $$
begin
  begin
    alter publication supabase_realtime add table public.dishes;
  exception
    when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.orders;
  exception
    when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.reviews;
  exception
    when duplicate_object then null;
  end;
end
$$;

insert into public.restaurants (id, name, slug, logo, currency, plan)
values (
  '11111111-1111-4111-8111-111111111111',
  'Dar Zitoun',
  'dar-zitoun',
  null,
  'MAD',
  'pro'
)
on conflict (slug) do update
set name = excluded.name,
    currency = excluded.currency,
    plan = excluded.plan;

insert into public.dishes (
  restaurant_id, title_ar, title_fr, title_en, description, price, category, image_url, is_available
)
select * from (
  values
    (
      '11111111-1111-4111-8111-111111111111'::uuid,
      'زعلوك', 'Zaalouk', 'Zaalouk',
      '{"ar":"سلطة باذنجان مشوي بزيت الزيتون والكمون والكزبرة.","fr":"Salade d’aubergines grillées à l’huile d’olive, cumin et coriandre.","en":"Charred eggplant salad with olive oil, cumin, and coriander."}'::jsonb,
      35, 'starters', null, true
    ),
    (
      '11111111-1111-4111-8111-111111111111'::uuid,
      'بريوات الجبن', 'Briouats au fromage', 'Cheese briouats',
      '{"ar":"مثلثات مقرمشة محشوة بالجبن العشبي، تقدم مع عسل حر.","fr":"Triangles feuilletés au fromage aux herbes, servis avec du miel.","en":"Crisp pastry triangles filled with herbed cheese, served with honey."}'::jsonb,
      45, 'starters', null, true
    ),
    (
      '11111111-1111-4111-8111-111111111111'::uuid,
      'حريرة', 'Harira', 'Harira',
      '{"ar":"شوربة العدس والطماطم بالحمص والكسبرة.","fr":"Soupe de lentilles et tomates, pois chiches et coriandre.","en":"Lentil and tomato soup with chickpeas and coriander."}'::jsonb,
      28, 'starters', null, true
    ),
    (
      '11111111-1111-4111-8111-111111111111'::uuid,
      'بسطيلة الدجاج', 'Pastilla au poulet', 'Chicken pastilla',
      '{"ar":"ورقة مقرمشة، دجاج مسكر باللوز والقرفة.","fr":"Feuilleté croustillant, poulet, amandes et cannelle, sucre glace.","en":"Crisp warqa pastry, spiced chicken, almonds, cinnamon, and icing sugar."}'::jsonb,
      95, 'mains', null, true
    ),
    (
      '11111111-1111-4111-8111-111111111111'::uuid,
      'طاجين الدجاج بالزيتون والحامض', 'Tajine de poulet citron olives', 'Chicken tagine with lemon & olives',
      '{"ar":"دجاج بلدي متبل بالزنجبيل والزعفران، زيتون أخضر وحامض مملح.","fr":"Poulet fermier, gingembre, safran, olives vertes et citron confit.","en":"Farm chicken with ginger, saffron, green olives, and preserved lemon."}'::jsonb,
      85, 'mains', null, true
    ),
    (
      '11111111-1111-4111-8111-111111111111'::uuid,
      'كسكس ملكي', 'Couscous royal', 'Royal couscous',
      '{"ar":"كسكس ناعم، لحم الغنم، الدجاج، والمرق بالخضر الموسمية.","fr":"Semoule fine, agneau, poulet et bouillon aux légumes de saison.","en":"Steamed semolina, lamb, chicken, and a seasonal vegetable broth."}'::jsonb,
      120, 'mains', null, true
    ),
    (
      '11111111-1111-4111-8111-111111111111'::uuid,
      'أتاي بالنعناع', 'Thé à la menthe', 'Moroccan mint tea',
      '{"ar":"شاي أخضر بالنعناع الطازج، يُسكب من علٍ في كأس بلوري.","fr":"Thé vert à la menthe fraîche, versé de haut dans un verre.","en":"Gunpowder green tea with fresh mint, poured from height into a glass."}'::jsonb,
      18, 'drinks', null, true
    ),
    (
      '11111111-1111-4111-8111-111111111111'::uuid,
      'عصير البرتقال', 'Jus d’orange pressé', 'Fresh orange juice',
      '{"ar":"برتقال المغرب المعصور عند الطلب، بلا سكر مضاف.","fr":"Oranges marocaines pressées minute, sans sucre ajouté.","en":"Moroccan oranges pressed to order, no added sugar."}'::jsonb,
      22, 'drinks', null, true
    ),
    (
      '11111111-1111-4111-8111-111111111111'::uuid,
      'عصير الأفوكادو باللوز', 'Jus d’avocat amande', 'Avocado almond juice',
      '{"ar":"أفوكادو كريمي، حليب اللوز، ولمسة ماء الزهر.","fr":"Avocat onctueux, lait d’amande et une touche d’eau de fleur d’oranger.","en":"Creamy avocado, almond milk, and a drop of orange-blossom water."}'::jsonb,
      32, 'drinks', null, false
    )
) as seed(
  restaurant_id, title_ar, title_fr, title_en, description, price, category, image_url, is_available
)
where not exists (
  select 1 from public.dishes d where d.restaurant_id = '11111111-1111-4111-8111-111111111111'
);

insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do update set public = true;

drop policy if exists "logos_public_read" on storage.objects;
drop policy if exists "logos_public_write" on storage.objects;
drop policy if exists "logos_public_update" on storage.objects;

create policy "logos_public_read"
  on storage.objects for select
  using (bucket_id = 'logos');

create policy "logos_public_write"
  on storage.objects for insert
  with check (bucket_id = 'logos');

create policy "logos_public_update"
  on storage.objects for update
  using (bucket_id = 'logos')
  with check (bucket_id = 'logos');
