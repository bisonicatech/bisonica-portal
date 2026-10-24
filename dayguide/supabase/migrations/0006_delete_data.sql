-- Deleting data.
-- 1. The family member who set Clocka up can delete everything for their household from the app.
-- 2. Households nobody has used for 12 months are deleted automatically (checked daily).
-- Safe to run more than once. Needs 0001-0005 first.

-- Everything about a household lives in dg_households, plus dg_members and
-- dg_link_codes, which are removed with it (on delete cascade).
create or replace function public.dg_delete_household(p_code text)
returns void language plpgsql security definer set search_path = public as $$
declare
  hid uuid := (public.dg_find(p_code)).id; -- look it up once, before deleting
begin
  delete from public.dg_households where id = hid;
end $$;

grant execute on function public.dg_delete_household(text) to anon;

-- Inactive: no phone has connected or changed anything for 12 months.
-- Households marked free-for-life are kept.
create or replace function public.dg_delete_inactive()
returns integer language plpgsql security definer set search_path = public as $$
declare
  n integer;
begin
  delete from public.dg_households
   where not comp
     and greatest(updated_at, coalesce(patient_seen_at, updated_at), coalesce(last_checkin_at, updated_at)) < now() - interval '12 months';
  get diagnostics n = row_count;
  delete from public.dg_link_codes where expires_at < now();
  return n;
end $$;

revoke all on function public.dg_delete_inactive() from public, anon, authenticated;

select cron.unschedule('clocka-delete-inactive')
 where exists (select 1 from cron.job where jobname = 'clocka-delete-inactive');
select cron.schedule('clocka-delete-inactive', '17 3 * * *', 'select public.dg_delete_inactive()');
