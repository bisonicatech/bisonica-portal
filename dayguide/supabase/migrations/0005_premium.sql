-- Free and Premium plans.
-- Free:    the cared-for phone + 1 family member, up to 8 daily times (same every day),
--          Out mode with the standard message, one call button.
-- Premium: unlimited family members and times, different times per weekday,
--          custom Out messages, one-off messages, extra call buttons, a video call button.
-- Households with comp = true get Premium free for life.
-- Safe to run more than once. Needs 0001-0004 first.

alter table public.dg_households add column if not exists comp boolean not null default false;
alter table public.dg_households add column if not exists premium_until timestamptz;
alter table public.dg_households add column if not exists adhoc_message text;
alter table public.dg_households add column if not exists adhoc_until timestamptz;
alter table public.dg_households add column if not exists contacts jsonb not null default '[]'::jsonb;
alter table public.dg_households add column if not exists video_contact jsonb;

-- Extra family members (beyond the one who set the household up).
create table if not exists public.dg_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.dg_households (id) on delete cascade,
  name text not null default '',
  created_at timestamptz not null default now()
);
alter table public.dg_members enable row level security;

create or replace function public.dg_is_premium(h public.dg_households)
returns boolean language sql stable as $$
  select h.comp or coalesce(h.premium_until > now(), false)
$$;

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

-- Schedule limits for free households. A free household that already has more
-- than 8 times (set up before plans existed) can keep them but not add more.
create or replace function public.dg_set_schedule(p_code text, p_schedule jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  h public.dg_households := public.dg_find(p_code);
  old_len int := coalesce(jsonb_array_length(h.schedule), 0);
  new_len int;
begin
  if jsonb_typeof(p_schedule) is distinct from 'array' or jsonb_array_length(p_schedule) > 200 then
    raise exception 'bad_schedule';
  end if;
  new_len := jsonb_array_length(p_schedule);
  if not public.dg_is_premium(h) then
    if new_len > 8 and new_len > old_len then
      raise exception 'premium_required';
    end if;
    if exists (
      select 1 from jsonb_array_elements(p_schedule) e
       where jsonb_typeof(e -> 'days') = 'array' and jsonb_array_length(e -> 'days') between 1 and 6
    ) then
      raise exception 'premium_required';
    end if;
  end if;
  update public.dg_households
     set schedule = p_schedule, schedule_updated_at = now(), updated_at = now()
   where id = h.id
  returning * into h;
  return public.dg_view(h);
end $$;

-- An extra family member joins with a 6-digit link code.
-- Free households allow one family member (the one who set it up).
create or replace function public.dg_join_family(p_link_code text, p_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  r public.dg_link_codes;
  h public.dg_households;
begin
  delete from public.dg_link_codes where expires_at < now();
  select * into r from public.dg_link_codes
   where link_code = regexp_replace(coalesce(p_link_code, ''), '\D', '', 'g');
  if not found then
    raise exception 'link_code_not_found';
  end if;
  select * into h from public.dg_households where id = r.household_id;
  if not public.dg_is_premium(h) then
    raise exception 'member_limit';
  end if;
  delete from public.dg_link_codes where link_code = r.link_code;
  insert into public.dg_members (household_id, name) values (h.id, coalesce(trim(p_name), ''));
  return public.dg_view(h);
end $$;

-- Records the household's subscription end date (set by the family member's app after a purchase).
create or replace function public.dg_set_premium(p_code text, p_until timestamptz)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  h public.dg_households;
begin
  update public.dg_households
     set premium_until = greatest(coalesce(premium_until, p_until), p_until), updated_at = now()
   where id = (public.dg_find(p_code)).id
  returning * into h;
  return public.dg_view(h);
end $$;

-- Premium: a one-off message on the cared-for screen for a while.
create or replace function public.dg_send_message(p_code text, p_message text, p_minutes int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  h public.dg_households := public.dg_find(p_code);
begin
  if not public.dg_is_premium(h) then
    raise exception 'premium_required';
  end if;
  update public.dg_households
     set adhoc_message = nullif(trim(coalesce(p_message, '')), ''),
         adhoc_until = case when nullif(trim(coalesce(p_message, '')), '') is null then null
                            else now() + make_interval(mins => least(greatest(coalesce(p_minutes, 60), 5), 1440)) end,
         updated_at = now()
   where id = h.id
  returning * into h;
  return public.dg_view(h);
end $$;

-- Premium: extra call buttons ([{name, phone}]) and one video call contact ({name, handle}).
create or replace function public.dg_set_contacts(p_code text, p_contacts jsonb, p_video_contact jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  h public.dg_households := public.dg_find(p_code);
begin
  if jsonb_typeof(p_contacts) is distinct from 'array' or jsonb_array_length(p_contacts) > 10 then
    raise exception 'bad_contacts';
  end if;
  if not public.dg_is_premium(h) and (jsonb_array_length(p_contacts) > 0 or p_video_contact is not null) then
    raise exception 'premium_required';
  end if;
  update public.dg_households
     set contacts = p_contacts, video_contact = p_video_contact, updated_at = now()
   where id = h.id
  returning * into h;
  return public.dg_view(h);
end $$;

revoke all on function public.dg_view(public.dg_households) from public, anon, authenticated;
revoke all on function public.dg_is_premium(public.dg_households) from public, anon, authenticated;
grant execute on function public.dg_join_family(text, text) to anon;
grant execute on function public.dg_set_premium(text, timestamptz) to anon;
grant execute on function public.dg_send_message(text, text, int) to anon;
grant execute on function public.dg_set_contacts(text, jsonb, jsonb) to anon;
