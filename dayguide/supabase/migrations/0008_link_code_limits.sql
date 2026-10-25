-- Stop people guessing 6-digit link codes.
-- After 10 wrong codes from the same internet connection in 15 minutes, further
-- tries are refused for a while. Wrong codes now return {"error": ...} instead of
-- failing, so the attempt is remembered (a failure would undo the record).
-- Safe to run more than once. Needs 0001-0007 first.

create table if not exists public.dg_link_attempts (
  ip text not null,
  at timestamptz not null default now()
);
create index if not exists dg_link_attempts_ip_at_idx on public.dg_link_attempts (ip, at);
alter table public.dg_link_attempts enable row level security;

-- The caller's internet address, as passed on by Supabase.
create or replace function public.dg_caller_ip()
returns text language sql stable as $$
  select coalesce(
    nullif(trim(split_part(coalesce(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ''), ',', 1)), ''),
    'unknown'
  )
$$;

-- Returns an error code if this caller has made too many wrong tries, otherwise null.
create or replace function public.dg_link_blocked(p_ip text)
returns text language sql stable security definer set search_path = public as $$
  select case
    when (select count(*) from public.dg_link_attempts where ip = p_ip and at > now() - interval '15 minutes') >= 10 then 'too_many_attempts'
    when (select count(*) from public.dg_link_attempts where at > now() - interval '1 minute') >= 300 then 'too_many_attempts'
  end
$$;

create or replace function public.dg_link_failed(p_ip text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  insert into public.dg_link_attempts (ip) values (p_ip);
  delete from public.dg_link_attempts where at < now() - interval '1 day';
  return jsonb_build_object('error', 'link_code_not_found');
end $$;

-- Cared-for person's phone: swap a link code for the household.
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
  delete from public.dg_link_codes
   where link_code = regexp_replace(coalesce(p_link_code, ''), '\D', '', 'g')
  returning * into r;
  if not found then
    return public.dg_link_failed(ip);
  end if;
  select * into h from public.dg_households where id = r.household_id;
  return public.dg_view(h);
end $$;

-- Another family member joins with a link code (Premium allows more than one).
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
  delete from public.dg_link_codes where link_code = r.link_code;
  insert into public.dg_members (household_id, name) values (h.id, coalesce(trim(p_name), ''));
  return public.dg_view(h);
end $$;

revoke all on function public.dg_link_blocked(text) from public, anon, authenticated;
revoke all on function public.dg_link_failed(text) from public, anon, authenticated;
grant execute on function public.dg_use_link_code(text) to anon;
grant execute on function public.dg_join_family(text, text) to anon;
