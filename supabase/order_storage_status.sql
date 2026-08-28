-- Order storage status for admin settlement (paid / cancelled / changed).
-- Safe to re-run in Supabase SQL Editor.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_storage_status') then
    create type public.order_storage_status as enum ('paid', 'cancelled', 'changed');
  end if;
end
$$;

alter table public.orders
  add column if not exists storage_status public.order_storage_status;
