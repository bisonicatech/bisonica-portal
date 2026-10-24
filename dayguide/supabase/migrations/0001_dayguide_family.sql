-- Clocka family link: "Out" mode, check-ins and alerts between the
-- cared-for person's phone and a family member's phone.
--
-- Phones never touch the table directly. They call the dg_* functions below
-- with the household's pairing code, which acts as the shared secret.
-- A job runs every minute to send check-in prompts and missed-check-in alerts
-- through Expo's push service.

create extension if not exists pg_net;
create extension if not exists pg_cron;

create table if not exists public.dg_households (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  patient_name text not null default '',
  carer_name text not null default '',
  carer_phone text not null default '',
  carer_push_token text,
  patient_push_token text,
  is_out boolean not null default false,
  out_message text not null default '',
  back_at timestamptz,
  checkin_every_minutes int not null default 60,
  checkin_grace_minutes int not null default 15,
  checkin_due_at timestamptz,
  checkin_prompted boolean not null default false,
  missed_alert_sent boolean not null default false,
  last_checkin_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- No policies: the table is only reachable through the functions below.
alter table public.dg_households enable row level security;

-- What the apps get back (never includes push tokens).
create or replace function public.dg_view(h public.dg_households)
returns jsonb language sql stable as $$
  select jsonb_build_object(
    'code', h.code,
    'patient_name', h.patient_name,
    'carer_name', h.carer_name,
    'carer_phone', h.carer_phone,
    'is_out', h.is_out,
    'out_message', h.out_message,
    'back_at', h.back_at,
    'checkin_every_minutes', h.checkin_every_minutes,
    'checkin_grace_minutes', h.checkin_grace_minutes,
    'checkin_due_at', h.checkin_due_at,
    'checkin_prompted', h.checkin_prompted,
    'missed_alert_sent', h.missed_alert_sent,
    'last_checkin_at', h.last_checkin_at
  )
$$;

create or replace function public.dg_push(p_token text, p_title text, p_body text, p_data jsonb default '{}')
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if p_token is null or p_token = '' then
    return;
  end if;
  perform net.http_post(
    url := 'https://exp.host/--/api/v2/push/send',
    body := jsonb_build_object(
      'to', p_token,
      'title', p_title,
      'body', p_body,
      'data', p_data,
      'sound', 'default',
      'priority', 'high',
      'channelId', 'family-alerts'
    ),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
end $$;

create or replace function public.dg_find(p_code text)
returns public.dg_households language plpgsql security definer set search_path = public as $$
declare
  h public.dg_households;
begin
  select * into h from public.dg_households where code = upper(trim(p_code));
  if not found then
    raise exception 'household_not_found';
  end if;
  return h;
end $$;

create or replace function public.dg_create_household(p_patient_name text, p_carer_name text, p_carer_phone text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  h public.dg_households;
begin
  insert into public.dg_households (code, patient_name, carer_name, carer_phone)
  values (
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
    coalesce(trim(p_patient_name), ''),
    coalesce(trim(p_carer_name), ''),
    coalesce(trim(p_carer_phone), '')
  )
  returning * into h;
  return public.dg_view(h);
end $$;

create or replace function public.dg_get_household(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  return public.dg_view(public.dg_find(p_code));
end $$;

create or replace function public.dg_update_household(p_code text, p_patient_name text, p_carer_name text, p_carer_phone text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  h public.dg_households;
begin
  update public.dg_households
     set patient_name = coalesce(trim(p_patient_name), patient_name),
         carer_name = coalesce(trim(p_carer_name), carer_name),
         carer_phone = coalesce(trim(p_carer_phone), carer_phone),
         updated_at = now()
   where id = (public.dg_find(p_code)).id
  returning * into h;
  return public.dg_view(h);
end $$;

-- p_role: 'patient' or 'carer'
create or replace function public.dg_set_push_token(p_code text, p_role text, p_token text)
returns void language plpgsql security definer set search_path = public as $$
declare
  hid uuid := (public.dg_find(p_code)).id;
begin
  if p_role = 'patient' then
    update public.dg_households set patient_push_token = p_token, updated_at = now() where id = hid;
  elsif p_role = 'carer' then
    update public.dg_households set carer_push_token = p_token, updated_at = now() where id = hid;
  else
    raise exception 'bad_role';
  end if;
end $$;

create or replace function public.dg_start_out(p_code text, p_back_at timestamptz, p_message text, p_every_minutes int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
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
   where id = (public.dg_find(p_code)).id
  returning * into h;
  return public.dg_view(h);
end $$;

create or replace function public.dg_end_out(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  h public.dg_households;
begin
  update public.dg_households
     set is_out = false,
         checkin_due_at = null,
         checkin_prompted = false,
         missed_alert_sent = false,
         updated_at = now()
   where id = (public.dg_find(p_code)).id
  returning * into h;
  return public.dg_view(h);
end $$;

create or replace function public.dg_check_in(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  h public.dg_households;
begin
  update public.dg_households
     set last_checkin_at = now(),
         checkin_prompted = false,
         missed_alert_sent = false,
         checkin_due_at = case when is_out then now() + make_interval(mins => checkin_every_minutes) end,
         updated_at = now()
   where id = (public.dg_find(p_code)).id
  returning * into h;

  perform public.dg_push(
    h.carer_push_token,
    h.patient_name || ' is okay ✓',
    h.patient_name || ' just tapped "I''m okay".',
    '{"type": "checked_in"}'::jsonb
  );
  return public.dg_view(h);
end $$;

-- Runs every minute.
create or replace function public.dg_tick()
returns void language plpgsql security definer set search_path = public as $$
declare
  h public.dg_households;
begin
  -- Check-in is due: ask the cared-for person.
  for h in
    select * from public.dg_households
     where is_out and not checkin_prompted and checkin_due_at <= now()
  loop
    perform public.dg_push(
      h.patient_push_token,
      'Are you okay, ' || h.patient_name || '?',
      'Tap here to let ' || h.carer_name || ' know.',
      '{"type": "checkin"}'::jsonb
    );
    update public.dg_households set checkin_prompted = true where id = h.id;
  end loop;

  -- No answer within the grace period: alert the family member once.
  for h in
    select * from public.dg_households
     where is_out and checkin_prompted and not missed_alert_sent
       and checkin_due_at + make_interval(mins => checkin_grace_minutes) <= now()
  loop
    perform public.dg_push(
      h.carer_push_token,
      h.patient_name || ' hasn''t answered the check-in',
      'No reply for ' || h.checkin_grace_minutes || ' minutes. Maybe give a call?',
      '{"type": "missed"}'::jsonb
    );
    update public.dg_households set missed_alert_sent = true where id = h.id;
  end loop;
end $$;

-- Only the app-facing functions are callable from the phones.
revoke all on function public.dg_view(public.dg_households) from public, anon, authenticated;
revoke all on function public.dg_push(text, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.dg_find(text) from public, anon, authenticated;
revoke all on function public.dg_tick() from public, anon, authenticated;

grant execute on function public.dg_create_household(text, text, text) to anon;
grant execute on function public.dg_get_household(text) to anon;
grant execute on function public.dg_update_household(text, text, text, text) to anon;
grant execute on function public.dg_set_push_token(text, text, text) to anon;
grant execute on function public.dg_start_out(text, timestamptz, text, int) to anon;
grant execute on function public.dg_end_out(text) to anon;
grant execute on function public.dg_check_in(text) to anon;

select cron.unschedule('dayguide-tick')
 where exists (select 1 from cron.job where jobname = 'dayguide-tick');
select cron.schedule('dayguide-tick', '* * * * *', 'select public.dg_tick()');
