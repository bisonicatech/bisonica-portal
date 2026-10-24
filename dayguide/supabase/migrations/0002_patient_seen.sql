-- Lets the family member's app show whether the cared-for person's phone is
-- linked and connected ("David's phone: connected 1 min ago").
-- Safe to run more than once.

alter table public.dg_households add column if not exists patient_seen_at timestamptz;

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
    'patient_seen_at', h.patient_seen_at
  )
$$;

-- Called by the cared-for person's phone every time it refreshes.
create or replace function public.dg_patient_seen(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  h public.dg_households;
begin
  update public.dg_households
     set patient_seen_at = now()
   where id = (public.dg_find(p_code)).id
  returning * into h;
  return public.dg_view(h);
end $$;

revoke all on function public.dg_view(public.dg_households) from public, anon, authenticated;
grant execute on function public.dg_patient_seen(text) to anon;
