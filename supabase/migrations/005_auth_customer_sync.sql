-- 005_auth_customer_sync.sql
--
-- Auth → public.customers sync (impl-plan §2.2):
--   AFTER INSERT on auth.users, seed a matching public.customers row so we
--   always have a customer profile to attach bookings to.
--
-- Idempotent: re-running the migration only replaces the trigger function.
-- ON CONFLICT(auth_user_id) DO NOTHING covers the case where the customers
-- row was created beforehand (e.g. via API).

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.customers (
    auth_user_id,
    email,
    full_name,
    google_sub,
    avatar_url
  )
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'sub', ''),
    nullif(new.raw_user_meta_data->>'avatar_url', '')
  )
  on conflict (auth_user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
