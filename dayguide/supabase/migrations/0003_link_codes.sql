-- Short, single-use link codes so the cared-for person's phone can be linked
-- by typing 6 digits instead of the long household code.
-- A link code works once and expires after 15 minutes.
-- Safe to run more than once.

create table if not exists public.dg_link_codes (
  link_code text primary key,
  household_id uuid not null references public.dg_households (id) on delete cascade,
  expires_at timestamptz not null
);

-- No policies: only reachable through the functions below.
alter table public.dg_link_codes enable row level security;

-- Family member's phone: make a new 6-digit link code (replaces any earlier one).
create or replace function public.dg_new_link_code(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  hid uuid := (public.dg_find(p_code)).id;
  v text;
  expires timestamptz := now() + interval '15 minutes';
begin
  delete from public.dg_link_codes where expires_at < now() or household_id = hid;
  loop
    -- gen_random_uuid() is cryptographically random.
    v := lpad((abs(('x' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))::bit(32)::int) % 1000000)::text, 6, '0');
    begin
      insert into public.dg_link_codes (link_code, household_id, expires_at) values (v, hid, expires);
      exit;
    exception when unique_violation then
      -- Same code already in use by another household: pick again.
    end;
  end loop;
  return jsonb_build_object('link_code', v, 'expires_at', expires);
end $$;

-- Cared-for person's phone: swap a link code for the household (including its long code).
create or replace function public.dg_use_link_code(p_link_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  r public.dg_link_codes;
  h public.dg_households;
begin
  delete from public.dg_link_codes where expires_at < now();
  delete from public.dg_link_codes
   where link_code = regexp_replace(coalesce(p_link_code, ''), '\D', '', 'g')
  returning * into r;
  if not found then
    raise exception 'link_code_not_found';
  end if;
  select * into h from public.dg_households where id = r.household_id;
  return public.dg_view(h);
end $$;

grant execute on function public.dg_new_link_code(text) to anon;
grant execute on function public.dg_use_link_code(text) to anon;
