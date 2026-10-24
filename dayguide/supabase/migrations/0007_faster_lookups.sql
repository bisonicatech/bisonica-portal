-- Speed: look each household up once per request.
-- Earlier versions looked the household up again for every row of the table
-- while updating, which gets slower as more families use Clocka.
-- Same behaviour as before. Safe to run more than once. Needs 0001-0006 first.

create or replace function public.dg_update_household(p_code text, p_patient_name text, p_carer_name text, p_carer_phone text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  hid uuid := (public.dg_find(p_code)).id;
  h public.dg_households;
begin
  update public.dg_households
     set patient_name = coalesce(trim(p_patient_name), patient_name),
         carer_name = coalesce(trim(p_carer_name), carer_name),
         carer_phone = coalesce(trim(p_carer_phone), carer_phone),
         updated_at = now()
   where id = hid
  returning * into h;
  return public.dg_view(h);
end $$;

create or replace function public.dg_start_out(p_code text, p_back_at timestamptz, p_message text, p_every_minutes int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  hid uuid := (public.dg_find(p_code)).id;
  h public.dg_households;
  every int := greatest(15, coalesce(p_every_minutes, 60));
begin
  update public.dg_households
     set is_out = true,
         out_message = coalesce(p_message, ''),
         back_at = p_back_at,
         checkin_every_minutes = every,
         checkin_due_at = now() + make_interval(mins => every),
         checkin_prompted = false,
         missed_alert_sent = false,
         updated_at = now()
   where id = hid
  returning * into h;
  return public.dg_view(h);
end $$;

create or replace function public.dg_end_out(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  hid uuid := (public.dg_find(p_code)).id;
  h public.dg_households;
begin
  update public.dg_households
     set is_out = false,
         checkin_due_at = null,
         checkin_prompted = false,
         missed_alert_sent = false,
         updated_at = now()
   where id = hid
  returning * into h;
  return public.dg_view(h);
end $$;

create or replace function public.dg_check_in(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  hid uuid := (public.dg_find(p_code)).id;
  h public.dg_households;
begin
  update public.dg_households
     set last_checkin_at = now(),
         checkin_prompted = false,
         missed_alert_sent = false,
         checkin_due_at = case when is_out then now() + make_interval(mins => checkin_every_minutes) end,
         updated_at = now()
   where id = hid
  returning * into h;

  perform public.dg_push(
    h.carer_push_token,
    h.patient_name || ' is okay ✓',
    h.patient_name || ' just tapped "I''m okay".',
    '{"type": "checked_in"}'::jsonb
  );
  return public.dg_view(h);
end $$;

create or replace function public.dg_patient_seen(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  hid uuid := (public.dg_find(p_code)).id;
  h public.dg_households;
begin
  update public.dg_households
     set patient_seen_at = now()
   where id = hid
  returning * into h;
  return public.dg_view(h);
end $$;

create or replace function public.dg_set_premium(p_code text, p_until timestamptz)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  hid uuid := (public.dg_find(p_code)).id;
  h public.dg_households;
begin
  update public.dg_households
     set premium_until = greatest(coalesce(premium_until, p_until), p_until), updated_at = now()
   where id = hid
  returning * into h;
  return public.dg_view(h);
end $$;

-- Indexes for the lookups by household.
create index if not exists dg_members_household_idx on public.dg_members (household_id);
create index if not exists dg_link_codes_household_idx on public.dg_link_codes (household_id);
