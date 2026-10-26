-- Security hardening (from the security review). Safe to run more than once. Needs 0001-0008 first.
--
-- 1. Family codes become 32 characters (about 122 random bits), far too many to guess.
--    Existing families get a new long code; the apps pick it up automatically on their
--    next refresh. The old short code keeps working until 0010_drop_legacy_codes.sql is run.
-- 2. Link codes become 8 digits (100 million possibilities instead of 1 million), still
--    single use, 15 minutes, and limited to 10 wrong tries per connection.
-- 3. Premium can no longer be switched on from a phone. Only the RevenueCat webhook
--    (an Edge Function holding a secret) can set it, after checking with RevenueCat.
-- 4. Limits on creating families, and on the size of names, messages and schedules.

-- ---------------------------------------------------------------------------
-- 1. Long family codes
-- ---------------------------------------------------------------------------

alter table public.dg_households add column if not exists legacy_code text;
create unique index if not exists dg_households_legacy_code_idx
  on public.dg_households (legacy_code) where legacy_code is not null;

-- 32 upper-case hex characters from a cryptographically random UUID.
create or replace function public.dg_new_code()
returns text language sql volatile as $$
  select upper(replace(gen_random_uuid()::text, '-', ''))
$$;

update public.dg_households
   set legacy_code = code, code = public.dg_new_code(), updated_at = now()
 where length(code) < 32;

create or replace function public.dg_find(p_code text)
returns public.dg_households language plpgsql security definer set search_path = public as $$
declare
  c text := upper(trim(coalesce(p_code, '')));
  h public.dg_households;
begin
  if length(c) >= 10 then
    select * into h from public.dg_households where code = c;
    if not found then
      -- Old short code, until 0010 removes them.
      select * into h from public.dg_households where legacy_code = c;
    end if;
  end if;
  if h.id is null then
    raise exception 'household_not_found';
  end if;
  return h;
end $$;

-- The app view now includes the household's id (not a secret: nothing accepts it as a
-- password). Phones use it as the RevenueCat customer ID, so the family code never
-- leaves Clocka's server.
create or replace function public.dg_view(h public.dg_households)
returns jsonb language sql stable as $$
  select jsonb_build_object(
    'id', h.id,
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
    'last_checkin_at', h.last_checkin_at,
    'patient_seen_at', h.patient_seen_at,
    'schedule', h.schedule,
    'schedule_updated_at', h.schedule_updated_at,
    'is_premium', public.dg_is_premium(h),
    'comp', h.comp,
    'premium_until', h.premium_until,
    'adhoc_message', case when h.adhoc_until > now() then h.adhoc_message end,
    'adhoc_until', case when h.adhoc_until > now() then h.adhoc_until end,
    'contacts', h.contacts,
    'video_contact', h.video_contact,
    'family_count', 1 + (select count(*) from public.dg_members m where m.household_id = h.id)
  )
$$;

-- ---------------------------------------------------------------------------
-- 4a. Limit how fast new families can be created (stops the database being flooded)
-- ---------------------------------------------------------------------------

create table if not exists public.dg_rate_events (
  kind text not null,
  ip text not null,
  at timestamptz not null default now()
);
create index if not exists dg_rate_events_kind_ip_at_idx on public.dg_rate_events (kind, ip, at);
alter table public.dg_rate_events enable row level security;

create or replace function public.dg_create_household(p_patient_name text, p_carer_name text, p_carer_phone text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_ip text := public.dg_caller_ip();
  h public.dg_households;
begin
  delete from public.dg_rate_events where at < now() - interval '1 day';
  insert into public.dg_rate_events (kind, ip) values ('create', v_ip);
  -- 20 new families an hour from one connection, 2000 an hour in total.
  if (select count(*) from public.dg_rate_events e where e.kind = 'create' and e.ip = v_ip and e.at > now() - interval '1 hour') > 20
     or (select count(*) from public.dg_rate_events where kind = 'create' and at > now() - interval '1 hour') > 2000 then
    raise exception 'too_many_attempts';
  end if;
  insert into public.dg_households (code, patient_name, carer_name, carer_phone)
  values (
    public.dg_new_code(),
    coalesce(trim(p_patient_name), ''),
    coalesce(trim(p_carer_name), ''),
    coalesce(trim(p_carer_phone), '')
  )
  returning * into h;
  return public.dg_view(h);
end $$;

-- ---------------------------------------------------------------------------
-- 2. 8-digit link codes
-- ---------------------------------------------------------------------------

-- A reusable code is only for the App Review demo family; delete it after approval.
alter table public.dg_link_codes add column if not exists reusable boolean not null default false;

create or replace function public.dg_new_link_code(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  hid uuid := (public.dg_find(p_code)).id;
  v text;
  expires timestamptz := now() + interval '15 minutes';
begin
  delete from public.dg_link_codes where expires_at < now() or (household_id = hid and not reusable);
  loop
    -- 48 cryptographically random bits, reduced to 8 digits.
    v := lpad(((('x' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))::bit(48)::bigint) % 100000000)::text, 8, '0');
    begin
      insert into public.dg_link_codes (link_code, household_id, expires_at) values (v, hid, expires);
      exit;
    exception when unique_violation then
      -- Already in use: pick again.
    end;
  end loop;
  return jsonb_build_object('link_code', v, 'expires_at', expires);
end $$;

create or replace function public.dg_use_link_code(p_link_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  ip text := public.dg_caller_ip();
  blocked text := public.dg_link_blocked(ip);
  r public.dg_link_codes;
  h public.dg_households;
begin
  if blocked is not null then
    return jsonb_build_object('error', blocked);
  end if;
  delete from public.dg_link_codes where expires_at < now();
  select * into r from public.dg_link_codes
   where link_code = regexp_replace(coalesce(p_link_code, ''), '\D', '', 'g');
  if not found then
    return public.dg_link_failed(ip);
  end if;
  if not r.reusable then
    delete from public.dg_link_codes where link_code = r.link_code;
  end if;
  select * into h from public.dg_households where id = r.household_id;
  return public.dg_view(h);
end $$;

create or replace function public.dg_join_family(p_link_code text, p_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  ip text := public.dg_caller_ip();
  blocked text := public.dg_link_blocked(ip);
  r public.dg_link_codes;
  h public.dg_households;
begin
  if blocked is not null then
    return jsonb_build_object('error', blocked);
  end if;
  delete from public.dg_link_codes where expires_at < now();
  select * into r from public.dg_link_codes
   where link_code = regexp_replace(coalesce(p_link_code, ''), '\D', '', 'g');
  if not found then
    return public.dg_link_failed(ip);
  end if;
  select * into h from public.dg_households where id = r.household_id;
  if not public.dg_is_premium(h) then
    return jsonb_build_object('error', 'member_limit');
  end if;
  if not r.reusable then
    delete from public.dg_link_codes where link_code = r.link_code;
  end if;
  insert into public.dg_members (household_id, name) values (h.id, left(coalesce(trim(p_name), ''), 100));
  return public.dg_view(h);
end $$;

-- ---------------------------------------------------------------------------
-- 3. Premium is set only by the RevenueCat webhook
-- ---------------------------------------------------------------------------

-- Phones still call this after a purchase (older app versions), but it no longer changes
-- anything: it just returns the household.
create or replace function public.dg_set_premium(p_code text, p_until timestamptz)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  return public.dg_view(public.dg_find(p_code));
end $$;

-- Called only by the revenuecat-webhook Edge Function (service role), after it has
-- asked RevenueCat directly when this household's Premium ends.
create or replace function public.dg_rc_set_premium(p_household uuid, p_until timestamptz)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.dg_households set premium_until = p_until, updated_at = now() where id = p_household;
end $$;

-- ---------------------------------------------------------------------------
-- 4b. Size limits (only checked for new changes, so existing data is never rejected)
-- ---------------------------------------------------------------------------

alter table public.dg_households drop constraint if exists dg_households_sizes;
alter table public.dg_households add constraint dg_households_sizes check (
  char_length(patient_name) <= 100
  and char_length(carer_name) <= 100
  and char_length(carer_phone) <= 40
  and char_length(out_message) <= 1000
  and char_length(coalesce(adhoc_message, '')) <= 1000
  and char_length(coalesce(carer_push_token, '')) <= 300
  and char_length(coalesce(patient_push_token, '')) <= 300
  and octet_length(coalesce(schedule::text, '')) <= 100000
  and octet_length(contacts::text) <= 10000
  and octet_length(coalesce(video_contact::text, '')) <= 1000
) not valid;

alter table public.dg_members drop constraint if exists dg_members_sizes;
alter table public.dg_members add constraint dg_members_sizes check (char_length(name) <= 100) not valid;

-- ---------------------------------------------------------------------------
-- Permissions: Supabase lets the public key run new functions by default, so lock
-- down every helper and allow only what the apps need.
-- ---------------------------------------------------------------------------

revoke all on function public.dg_new_code() from public, anon, authenticated;
revoke all on function public.dg_caller_ip() from public, anon, authenticated;
revoke all on function public.dg_find(text) from public, anon, authenticated;
revoke all on function public.dg_view(public.dg_households) from public, anon, authenticated;
revoke all on function public.dg_rc_set_premium(uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.dg_rc_set_premium(uuid, timestamptz) to service_role;

grant execute on function public.dg_create_household(text, text, text) to anon;
grant execute on function public.dg_new_link_code(text) to anon;
grant execute on function public.dg_use_link_code(text) to anon;
grant execute on function public.dg_join_family(text, text) to anon;
grant execute on function public.dg_set_premium(text, timestamptz) to anon;
