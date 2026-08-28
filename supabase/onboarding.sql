-- Additive onboarding schema for existing SmartDine projects.
-- Safe to re-run. New projects can use schema.sql instead.

alter table public.restaurants
  add column if not exists plan text;

update public.restaurants
set plan = 'starter'
where plan is null;

alter table public.restaurants
  alter column plan set default 'starter';

alter table public.restaurants
  alter column plan set not null;

alter table public.restaurants
  drop constraint if exists restaurants_plan_check;

alter table public.restaurants
  add constraint restaurants_plan_check check (plan in ('starter', 'pro', 'enterprise'));

alter table public.restaurants
  add column if not exists owner_id uuid;

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

create index if not exists restaurant_admins_restaurant_id_idx on public.restaurant_admins (restaurant_id);

alter table public.restaurant_admins replica identity full;
alter table public.restaurant_admins enable row level security;

drop policy if exists "admins_public_read" on public.restaurant_admins;
drop policy if exists "admins_public_write" on public.restaurant_admins;
create policy "admins_public_read" on public.restaurant_admins for select using (true);
create policy "admins_public_write" on public.restaurant_admins for all using (true) with check (true);

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

alter table public.restaurants
  add column if not exists phone text;

alter table public.restaurants
  add column if not exists default_locale text;

update public.restaurants
set default_locale = 'fr'
where default_locale is null;

alter table public.restaurants
  alter column default_locale set default 'fr';

alter table public.restaurants
  alter column default_locale set not null;

alter table public.restaurants
  drop constraint if exists restaurants_default_locale_check;

alter table public.restaurants
  add constraint restaurants_default_locale_check
  check (default_locale in ('ar', 'fr', 'en'));

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

alter table public.reviews replica identity full;
alter table public.reviews enable row level security;

drop policy if exists "reviews_public_read" on public.reviews;
drop policy if exists "reviews_public_write" on public.reviews;
create policy "reviews_public_read" on public.reviews for select using (true);
create policy "reviews_public_write" on public.reviews for all using (true) with check (true);

do $$
begin
  begin
    alter publication supabase_realtime add table public.reviews;
  exception
    when duplicate_object then null;
  end;
end
$$;

alter table public.restaurants
  add column if not exists is_trial boolean;

alter table public.restaurants
  add column if not exists trial_ends_at timestamptz;

update public.restaurants
set
  trial_ends_at = coalesce(trial_ends_at, created_at + interval '7 days'),
  is_trial = true
where plan = 'starter';

update public.restaurants
set is_trial = false
where plan is distinct from 'starter';

alter table public.restaurants
  alter column is_trial set default false;

update public.restaurants
set is_trial = false
where is_trial is null;

alter table public.restaurants
  alter column is_trial set not null;

alter table public.restaurants
  add column if not exists suspended boolean;

update public.restaurants
set suspended = false
where suspended is null;

alter table public.restaurants
  alter column suspended set default false;

alter table public.restaurants
  alter column suspended set not null;

create table if not exists public.super_admins (
  email text primary key
);

alter table public.super_admins enable row level security;
revoke all on table public.super_admins from anon, authenticated;

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

do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_storage_status') then
    create type public.order_storage_status as enum ('paid', 'cancelled', 'changed');
  end if;
end
$$;

alter table public.orders
  add column if not exists storage_status public.order_storage_status;

