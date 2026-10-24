-- Shared daily schedule: the family member can edit the cared-for person's
-- schedule from their own phone, and either phone's changes reach the other.
-- Safe to run more than once. Includes 0002's column in case that wasn't run.

alter table public.dg_households add column if not exists patient_seen_at timestamptz;
alter table public.dg_households add column if not exists schedule jsonb;
alter table public.dg_households add column if not exists schedule_updated_at timestamptz;

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
    'schedule_updated_at', h.schedule_updated_at
  )
$$;

-- Either phone: replace the schedule (a JSON array of entries).
create or replace function public.dg_set_schedule(p_code text, p_schedule jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  h public.dg_households;
begin
  if jsonb_typeof(p_schedule) is distinct from 'array' or jsonb_array_length(p_schedule) > 100 then
    raise exception 'bad_schedule';
  end if;
  update public.dg_households
     set schedule = p_schedule,
         schedule_updated_at = now(),
         updated_at = now()
   where id = (public.dg_find(p_code)).id
  returning * into h;
  return public.dg_view(h);
end $$;

revoke all on function public.dg_view(public.dg_households) from public, anon, authenticated;
grant execute on function public.dg_set_schedule(text, jsonb) to anon;
